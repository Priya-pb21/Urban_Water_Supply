const pool = require('../config/db');

const fallbackUser = {
  id: null,
  name: 'Guest User',
  email: 'guest@water.local',
  role: 'user',
  is_active: true,
};

const authenticate = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];

    if (userId) {
      const result = await pool.query(
        'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows[0]?.is_active) {
        req.user = result.rows[0];
        return next();
      }
    }

    req.user = {
      ...fallbackUser,
      role: req.headers['x-user-role'] || fallbackUser.role,
      name: req.headers['x-user-name'] || fallbackUser.name,
    };
    next();
  } catch (err) {
    next(err);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user?.role === 'admin' || roles.includes(req.user?.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}`,
    });
  };
};

module.exports = { authenticate, authorize };
