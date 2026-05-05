const pool = require('../config/db');
const { auditLog } = require('../middleware/audit');

// GET /api/demand
const getAllDemand = async (req, res, next) => {
  try {
    const { date, area_id, status } = req.query;
    let query = `
      SELECT d.*, a.name AS area_name, a.area_type, a.latitude, a.longitude,
             u.name AS requested_by_name
      FROM demand d
      JOIN areas a ON d.area_id = a.id
      LEFT JOIN users u ON d.requested_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (date) { query += ` AND DATE(d.timestamp) = $${idx++}`; params.push(date); }
    if (area_id) { query += ` AND d.area_id = $${idx++}`; params.push(area_id); }
    if (status) { query += ` AND d.status = $${idx++}`; params.push(status); }

    // Area managers see areas assigned to them plus demands they submitted.
    if (req.user.role === 'area_manager') {
      query += ` AND (a.manager_id = $${idx} OR d.requested_by = $${idx})`;
      params.push(req.user.id);
      idx++;
    }

    query += ' ORDER BY d.timestamp DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// POST /api/demand
const createDemand = async (req, res, next) => {
  try {
    const { area_id, quantity, priority, notes } = req.body;

    // Validate area exists
    const areaCheck = await pool.query(
      'SELECT id, manager_id FROM areas WHERE id = $1 AND is_active = TRUE',
      [area_id]
    );
    if (!areaCheck.rows[0]) return res.status(404).json({ success: false, message: 'Area not found' });

    if (req.user.role === 'area_manager' && !areaCheck.rows[0].manager_id) {
      await pool.query('UPDATE areas SET manager_id = $1 WHERE id = $2', [req.user.id, area_id]);
    }

    const result = await pool.query(
      `INSERT INTO demand (area_id, quantity, priority, notes, requested_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [area_id, quantity, priority, notes || null, req.user.id]
    );

    await auditLog('CREATE_DEMAND', 'demand', result.rows[0].id, req.user.id, null, result.rows[0], req.ip);
    res.status(201).json({ success: true, message: 'Demand submitted', data: result.rows[0] });
  } catch (err) { next(err); }
};

// PUT /api/demand/:id
const updateDemand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, priority, notes } = req.body;

    const old = await pool.query('SELECT * FROM demand WHERE id = $1', [id]);
    if (!old.rows[0]) return res.status(404).json({ success: false, message: 'Demand not found' });
    if (old.rows[0].status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending demands can be updated' });
    }

    const result = await pool.query(
      `UPDATE demand SET quantity=$1, priority=$2, notes=$3 WHERE id=$4 RETURNING *`,
      [quantity, priority, notes, id]
    );

    await auditLog('UPDATE_DEMAND', 'demand', id, req.user.id, old.rows[0], result.rows[0], req.ip);
    res.json({ success: true, message: 'Demand updated', data: result.rows[0] });
  } catch (err) { next(err); }
};

// GET /api/demand/summary - today's summary
const getDemandSummary = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total_requests,
        SUM(quantity) AS total_demanded,
        AVG(priority) AS avg_priority,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'fulfilled' THEN 1 END) AS fulfilled,
        COUNT(CASE WHEN status = 'partial' THEN 1 END) AS partial
      FROM demand
      WHERE DATE(timestamp) = CURRENT_DATE
    `);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

module.exports = { getAllDemand, createDemand, updateDemand, getDemandSummary };
