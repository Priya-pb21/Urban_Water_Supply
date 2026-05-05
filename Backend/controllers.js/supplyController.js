const pool = require('../config/db');
const { auditLog } = require('../middleware/audit');

// GET /api/supply
const getAllSupply = async (req, res, next) => {
  try {
    const { date } = req.query;
    let query = `SELECT s.*, u.name AS created_by_name FROM supply s
                 LEFT JOIN users u ON s.created_by = u.id WHERE 1=1`;
    const params = [];

    if (date) { query += ' AND s.date = $1'; params.push(date); }
    query += ' ORDER BY s.date DESC, s.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// GET /api/supply/today
const getTodaySupply = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM supply WHERE date = CURRENT_DATE ORDER BY created_at DESC LIMIT 1`
    );
    if (!result.rows[0]) {
      return res.json({ success: true, data: null, message: 'No supply set for today' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// POST /api/supply (admin only)
const createSupply = async (req, res, next) => {
  try {
    const { total_water, date, time_slot, source } = req.body;

    const result = await pool.query(
      `INSERT INTO supply (total_water, available, date, time_slot, source, created_by)
       VALUES ($1, $1, $2, $3, $4, $5) RETURNING *`,
      [total_water, date || new Date().toISOString().split('T')[0], time_slot, source || null, req.user.id]
    );

    await auditLog('CREATE_SUPPLY', 'supply', result.rows[0].id, req.user.id, null, result.rows[0], req.ip);
    res.status(201).json({ success: true, message: 'Supply recorded', data: result.rows[0] });
  } catch (err) { next(err); }
};

// PUT /api/supply/:id (admin only)
const updateSupply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { total_water, available, time_slot, source } = req.body;

    const old = await pool.query('SELECT * FROM supply WHERE id = $1', [id]);
    if (!old.rows[0]) return res.status(404).json({ success: false, message: 'Supply record not found' });

    const result = await pool.query(
      `UPDATE supply SET total_water=$1, available=$2, time_slot=$3, source=$4 WHERE id=$5 RETURNING *`,
      [total_water, available, time_slot, source, id]
    );

    await auditLog('UPDATE_SUPPLY', 'supply', id, req.user.id, old.rows[0], result.rows[0], req.ip);
    res.json({ success: true, message: 'Supply updated', data: result.rows[0] });
  } catch (err) { next(err); }
};

module.exports = { getAllSupply, getTodaySupply, createSupply, updateSupply };