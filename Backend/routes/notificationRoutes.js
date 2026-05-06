import express from 'express';
import { getMyNotifications, markNotificationAsRead } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getMyNotifications);
router.put('/:id/read', authenticate, markNotificationAsRead);

export default router;
