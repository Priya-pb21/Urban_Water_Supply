/* import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { auditLog } from '../middleware/audit.js';

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'user' } = req.body;
    const allowedRoles = ['admin', 'area_manager', 'user'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, passwordHash, role]
    );

    await auditLog('REGISTER_USER', 'users', result.rows[0].id, null, null, result.rows[0], req.ip);

    res.status(201).json({
      success: true,
      message: 'User registered',
      data: {
        user: publicUser(result.rows[0]),
      },
    });
  } catch (err) {
    throw err
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    await auditLog('LOGIN', 'users', user.id, user.id, null, { email: user.email }, req.ip);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: publicUser(user),
      },
    });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res) => {
  res.json({ success: true, data: publicUser(req.user) });
};

export { register, login, me };*/

import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { auditLog } from '../middleware/audit.js';

// Utility: return only safe user fields
const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// REGISTER
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    const allowedRoles = ['admin', 'area_manager', 'user'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, passwordHash, role]
    );

    // Audit log
    await auditLog(
      'REGISTER_USER',
      'users',
      result.rows[0].id,
      null,
      null,
      result.rows[0],
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'User registered',
      data: {
        user: publicUser(result.rows[0]),
      },
    });
  } catch (err) {
    next(err); // ✅ FIXED (removed throw)
  }
};

// LOGIN
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Audit log
    await auditLog(
      'LOGIN',
      'users',
      user.id,
      user.id,
      null,
      { email: user.email },
      req.ip
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: publicUser(user),
        // token: "optional-jwt-token"
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET CURRENT USER
export const me = async (req, res) => {
  res.json({
    success: true,
    data: publicUser(req.user),
  });
};
