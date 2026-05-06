import pool from '../config/db.js';
import { emitToUser } from './socketService.js';

async function createNotification(userId, title, message, type = 'alert') {
  if (!userId) {
    return null;
  }

  const result = await pool.query(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, title, message, type]
  );

  const notification = result.rows[0];
  emitToUser(userId, 'notification:new', notification);

  return notification;
}

async function notifyAdmins(message, title = 'New Alert', type = 'alert') {
  const admins = await pool.query(
    `SELECT id FROM users
     WHERE role = 'admin' AND is_active = TRUE`
  );

  const notifications = [];
  for (const admin of admins.rows) {
    const notification = await createNotification(admin.id, title, message, type);
    if (notification) {
      notifications.push(notification);
    }
  }

  return notifications;
}

async function notifyAreaManager(areaId, message, title = 'Area Alert', type = 'alert') {
  const result = await pool.query(
    `SELECT manager_id FROM areas
     WHERE id = $1 AND manager_id IS NOT NULL AND is_active = TRUE`,
    [areaId]
  );

  const managerId = result.rows[0]?.manager_id;
  if (!managerId) {
    return null;
  }

  return createNotification(managerId, title, message, type);
}

async function notifyIssueCreated(areaId, areaName, issueType, severity) {
  const readableIssue = issueType.replace(/_/g, ' ');
  const title = 'New Water Issue Reported';
  const message = `${readableIssue} reported in ${areaName}. Severity: ${severity}. Immediate attention required.`;

  const [managerNotification, adminNotifications] = await Promise.all([
    notifyAreaManager(areaId, message, title, 'issue'),
    notifyAdmins(message, title, 'issue'),
  ]);

  return {
    manager_notification: managerNotification,
    admin_notifications: adminNotifications,
  };
}

export  {
  createNotification,
  notifyAdmins,
  notifyAreaManager,
  notifyIssueCreated,
};
