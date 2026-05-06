import pool from '../config/db.js';

const getMyNotifications = async (req, res, next) => {
  try {
    const { is_read, limit = 50 } = req.query;
    const params = [req.user.id];
    let query = `
      SELECT *
      FROM notifications
      WHERE user_id = $1
    `;

    if (is_read !== undefined) {
      params.push(is_read === 'true');
      query += ` AND is_read = $${params.length}`;
    }

    params.push(Math.min(parseInt(limit, 10) || 50, 100));
    query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification marked as read', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

export { getMyNotifications, markNotificationAsRead };
