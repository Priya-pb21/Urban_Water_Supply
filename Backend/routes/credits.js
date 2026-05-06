import express from 'express';
import pool from '../config/db.js';
const router = express.Router();

// GET all area credits with priority info
router.get('/', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT ac.id, ac.area_id, a.name AS area_name, a.area_type,
           ac.credits, ap.priority_rank, ac.last_updated
    FROM area_credits ac
    JOIN areas a ON a.id = ac.area_id
    JOIN area_priorities ap ON ap.area_type = a.area_type
    ORDER BY ap.priority_rank, ac.credits DESC
  `);
  res.json(rows);
});

// PUT update credits for an area
router.put('/:areaId', async (req, res) => {
  const { credits } = req.body;
  if (credits < 10 || credits > 100)
    return res.status(400).json({ error: 'Credits must be between 10 and 100' });

  const { rows } = await pool.query(
    `INSERT INTO area_credits (area_id, credits, last_updated)
     VALUES ($1, $2, NOW())
     ON CONFLICT (area_id) DO UPDATE SET credits = $2, last_updated = NOW()
     RETURNING *`,
    [req.params.areaId, credits]
  );
  res.json(rows[0]);
});

export default router;