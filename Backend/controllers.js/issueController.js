const pool = require('../config/db');
const { auditLog } = require('../middleware/audit');
const { notifyIssueCreated } = require('../services/notificationService');

const getAllIssues = async (req, res, next) => {
  try {
    const { status, area_id, severity } = req.query;
    let query = `
      SELECT ir.*, a.name AS area_name, a.latitude, a.longitude,
             reporter.name AS reported_by_name, resolver.name AS resolved_by_name
      FROM issue_reports ir
      JOIN areas a ON ir.area_id = a.id
      LEFT JOIN users reporter ON ir.reported_by = reporter.id
      LEFT JOIN users resolver ON ir.resolved_by = resolver.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (status) { query += ` AND ir.status = $${idx++}`; params.push(status); }
    if (area_id) { query += ` AND ir.area_id = $${idx++}`; params.push(area_id); }
    if (severity) { query += ` AND ir.severity = $${idx++}`; params.push(severity); }

    if (req.user.role === 'area_manager') {
      query += ` AND a.manager_id = $${idx++}`;
      params.push(req.user.id);
    }

    query += ' ORDER BY ir.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

const createIssue = async (req, res, next) => {
  try {
    const { area_id, issue_type, description, severity = 'medium' } = req.body;

    const areaCheck = await pool.query(
      'SELECT id, name FROM areas WHERE id = $1 AND is_active = TRUE',
      [area_id]
    );
    if (!areaCheck.rows[0]) {
      return res.status(404).json({ success: false, message: 'Area not found' });
    }

    const result = await pool.query(
      `INSERT INTO issue_reports (area_id, reported_by, issue_type, description, severity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [area_id, req.user.id, issue_type, description, severity]
    );

    await auditLog('CREATE_ISSUE', 'issue_reports', result.rows[0].id, req.user.id, null, result.rows[0], req.ip);

    const notifications = await notifyIssueCreated(
      area_id,
      areaCheck.rows[0].name,
      issue_type,
      severity
    );

    res.status(201).json({
      success: true,
      message: 'Issue reported and notifications sent',
      data: result.rows[0],
      notifications,
    });
  } catch (err) {
    next(err);
  }
};

const updateIssueStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const old = await pool.query('SELECT * FROM issue_reports WHERE id = $1', [id]);
    if (!old.rows[0]) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const result = await pool.query(
      `UPDATE issue_reports
       SET status = $1,
           resolved_by = CASE WHEN $1 IN ('resolved', 'closed') THEN $2 ELSE resolved_by END,
           resolved_at = CASE WHEN $1 IN ('resolved', 'closed') THEN CURRENT_TIMESTAMP ELSE resolved_at END
       WHERE id = $3
       RETURNING *`,
      [status, req.user.id, id]
    );

    await auditLog('UPDATE_ISSUE_STATUS', 'issue_reports', id, req.user.id, old.rows[0], result.rows[0], req.ip);
    res.json({ success: true, message: 'Issue updated', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllIssues, createIssue, updateIssueStatus };
