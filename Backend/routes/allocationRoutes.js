import express from 'express';
import {body} from 'express-validator';
import { getAllAllocations, getDashboard, getAreaHistory } from '../controllers/allocationController.js';
import {authenticate, authorize} from '../middleware/auth.js';
import {validate} from '../middleware/validate.js';

import router from './areaRoutes.js';

router.get('/', authenticate, getAllAllocations);
router.get('/dashboard', authenticate, authorize('admin'), getDashboard);
router.get('/history/:area_id', authenticate, getAreaHistory);

router.post('/run', async (req, res) => {
  try {
    // 1. Get today's total supply
    const supplyRes = await pool.query(
      `SELECT COALESCE(SUM(quantity), 0) AS total FROM supply WHERE date = CURRENT_DATE`
    );
    const totalSupply = parseFloat(supplyRes.rows[0].total);

    // 2. Get all pending demands with area info, priority, credits
    const demandRes = await pool.query(`
      SELECT d.id, d.area_id, a.name AS area_name, a.area_type,
             d.quantity AS demanded,
             ap.priority_rank,
             COALESCE(ac.credits, 50) AS credits
      FROM demand d
      JOIN areas a ON a.id = d.area_id
      JOIN area_priorities ap ON ap.area_type = a.area_type
      LEFT JOIN area_credits ac ON ac.area_id = d.area_id
      WHERE d.status = 'pending' AND d.date = CURRENT_DATE
      ORDER BY ap.priority_rank ASC, ac.credits DESC
    `);

    const demands = demandRes.rows;
    const totalDemand = demands.reduce((sum, d) => sum + parseFloat(d.demanded), 0);

    let mode, surplusAmount = 0;
    const allocations = [];

    if (totalSupply >= totalDemand) {
      // SURPLUS: Everyone gets what they asked for
      mode = 'surplus';
      surplusAmount = totalSupply - totalDemand;
      for (const d of demands) {
        allocations.push({ ...d, allocated: parseFloat(d.demanded), fully_satisfied: true });
      }
    } else {
      // DEFICIT: Distribute by priority + credits
      mode = 'deficit';
      let remaining = totalSupply;

      for (const d of demands) {
        if (remaining <= 0) {
          allocations.push({ ...d, allocated: 0, fully_satisfied: false });
          continue;
        }
        // Weight = (max_priority - priority_rank + 1) * credits
        // Higher priority_rank number = lower priority, so invert
        const weight = (5 - d.priority_rank) * d.credits; // 5 is max_rank+1
        const fairShare = (weight / getTotalWeight(demands)) * totalSupply;
        const allocated = Math.min(fairShare, parseFloat(d.demanded), remaining);
        remaining -= allocated;
        allocations.push({
          ...d,
          allocated: Math.round(allocated * 100) / 100,
          fully_satisfied: allocated >= parseFloat(d.demanded)
        });
      }
    }

    // 3. Save allocations to DB
    for (const a of allocations) {
      await pool.query(
        `INSERT INTO allocation (area_id, quantity, date, status)
         VALUES ($1, $2, CURRENT_DATE, 'allocated')
         ON CONFLICT (area_id, date) DO UPDATE SET quantity = $2`,
        [a.area_id, a.allocated]
      );
    }

    // 4. Log this run
    const logRes = await pool.query(
      `INSERT INTO allocation_log (total_supply, total_demand, mode, surplus_amount)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [totalSupply, totalDemand, mode, surplusAmount]
    );
    const logId = logRes.rows[0].id;
    for (const a of allocations) {
      await pool.query(
        `INSERT INTO allocation_log_items
         (log_id, area_id, area_name, area_type, priority_rank, credits, demanded, allocated, fully_satisfied)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [logId, a.area_id, a.area_name, a.area_type, a.priority_rank, a.credits, a.demanded, a.allocated, a.fully_satisfied]
      );
    }

    res.json({ mode, totalSupply, totalDemand, surplusAmount, allocations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

function getTotalWeight(demands) {
  return demands.reduce((sum, d) => sum + (5 - d.priority_rank) * d.credits, 0);
}

export default router;