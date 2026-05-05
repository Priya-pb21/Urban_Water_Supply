const pool = require('../config/db');

const auditLog = async (action, entity, entityId, performedBy, oldData, newData, ipAddress) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (action, entity, entity_id, performed_by, old_data, new_data, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [action, entity, entityId, performedBy, oldData ? JSON.stringify(oldData) : null,
       newData ? JSON.stringify(newData) : null, ipAddress]
    );
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

module.exports = { auditLog };