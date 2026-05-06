import pool from '../config/db.js';
import { allocateWater } from '../services/allocationEngine.js';
import { auditLog } from '../middleware/audit.js';

// POST /api/allocation/run (admin only)
// Runs the allocation engine for a given supply and date
const runAllocation = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { supply_id, date } = req.body;

    // 1. Fetch supply record
    const supplyResult = await client.query(
      'SELECT * FROM supply WHERE id = $1',
      [supply_id]
    );
    if (!supplyResult.rows[0]) {
      return res.status(404).json({ success: false, message: 'Supply record not found' });
    }
    const supply = supplyResult.rows[0];

    // 2. Fetch all pending demands for the date
    const demandResult = await client.query(`
      SELECT d.*, a.name AS area_name, a.area_type
      FROM demand d
      JOIN areas a ON d.area_id = a.id
      WHERE d.status = 'approved'
        AND DATE(d.timestamp) = $1
        AND a.is_active = TRUE
      ORDER BY d.priority DESC
    `, [date || supply.date]);

    if (!demandResult.rows.length) {
      return res.status(400).json({ success: false, message: 'No approved demands found for this date' });
    }

    // 3. Run the allocation engine
    const { allocations, summary, conflictResolved } = allocateWater(
      parseFloat(supply.available || supply.total_water),
      demandResult.rows
    );

    // 4. Persist allocations in a transaction
    await client.query('BEGIN');

    const savedAllocations = [];
    for (const alloc of allocations) {
      const row = await client.query(
        `INSERT INTO allocation
           (area_id, supply_id, demand_id, allocated_water, demanded_water, shortage, reason, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          alloc.area_id, supply_id, alloc.demand_id,
          alloc.allocated_water, alloc.demanded_water,
          alloc.shortage, alloc.reason, alloc.status, req.user.id,
        ]
      );

      // Update demand status
      await client.query(
        `UPDATE demand SET status = $1 WHERE id = $2`,
        [alloc.status === 'fulfilled' ? 'fulfilled' : 'partial', alloc.demand_id]
      );

      savedAllocations.push(row.rows[0]);
    }

    // 5. Update supply available water
    const totalAllocated = allocations.reduce((s, a) => s + a.allocated_water, 0);
    await client.query(
      `UPDATE supply SET available = available - $1 WHERE id = $2`,
      [totalAllocated, supply_id]
    );

    await client.query('COMMIT');

    await auditLog('RUN_ALLOCATION', 'allocation', null, req.user.id, null, summary, req.ip);

    res.status(201).json({
      success: true,
      message: conflictResolved
        ? '⚠️ Conflict detected and resolved. Water allocated using priority-based engine.'
        : '✅ Water allocated successfully. All demands fulfilled.',
      data: {
        summary,
        allocations: allocations.map((a, i) => ({
          ...savedAllocations[i],
          area_name: a.area_name,
          reason: a.reason,
        })),
        conflict_resolved: conflictResolved,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
};

// GET /api/allocation
const getAllAllocations = async (req, res, next) => {
  try {
    const { date, area_id, status } = req.query;
    let query = `
      SELECT al.*, a.name AS area_name, a.area_type, a.latitude, a.longitude,
             u.name AS created_by_name
      FROM allocation al
      JOIN areas a ON al.area_id = a.id
      LEFT JOIN users u ON al.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (date)    { query += ` AND DATE(al.timestamp) = $${idx++}`; params.push(date); }
    if (area_id) { query += ` AND al.area_id = $${idx++}`;         params.push(area_id); }
    if (status)  { query += ` AND al.status = $${idx++}`;          params.push(status); }

    query += ' ORDER BY al.timestamp DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// GET /api/allocation/dashboard - summary stats for admin dashboard
const getDashboard = async (req, res, next) => {
  try {
    const [supplyRes, demandRes, allocRes, issueRes] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(total_water),0) AS total_supply,
                         COALESCE(SUM(available),0) AS remaining
                  FROM supply WHERE date = CURRENT_DATE`),
      pool.query(`SELECT COALESCE(SUM(quantity),0) AS total_demand,
                         COUNT(*) AS requests
                  FROM demand
                  WHERE DATE(timestamp) = CURRENT_DATE
                    AND status IN ('approved', 'fulfilled', 'partial')`),
      pool.query(`SELECT COALESCE(SUM(allocated_water),0) AS total_allocated,
                         COUNT(CASE WHEN status='shortage' THEN 1 END) AS shortage_areas,
                         COUNT(CASE WHEN status='fulfilled' THEN 1 END) AS fulfilled_areas
                  FROM allocation WHERE DATE(timestamp) = CURRENT_DATE`),
      pool.query(`SELECT COUNT(*) AS open_issues FROM issue_reports WHERE status='open'`),
    ]);

    // Last 7 days trend
    const trendRes = await pool.query(`
      SELECT DATE(al.timestamp) AS date,
             SUM(al.allocated_water) AS allocated,
             SUM(al.demanded_water) AS demanded
      FROM allocation al
      WHERE al.timestamp >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(al.timestamp)
      ORDER BY date
    `);

    res.json({
      success: true,
      data: {
        today: {
          supply:          supplyRes.rows[0],
          demand:          demandRes.rows[0],
          allocation:      allocRes.rows[0],
          open_issues:     parseInt(issueRes.rows[0].open_issues),
        },
        trend_7days: trendRes.rows,
      },
    });
  } catch (err) { next(err); }
};

// GET /api/allocation/history/:area_id
const getAreaHistory = async (req, res, next) => {
  try {
    const { area_id } = req.params;
    const result = await pool.query(`
      SELECT al.*, s.date AS supply_date
      FROM allocation al
      LEFT JOIN supply s ON al.supply_id = s.id
      WHERE al.area_id = $1
      ORDER BY al.timestamp DESC
      LIMIT 30
    `, [area_id]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

const getAllocationLog = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM allocation_log
      ORDER BY run_at DESC
      LIMIT 50
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

export { runAllocation, getAllAllocations, getDashboard, getAreaHistory, getAllocationLog };
