const express = require('express');
const { getMyNotifications, markNotificationAsRead } = require('../controllers.js/notificationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, getMyNotifications);
router.put('/:id/read', authenticate, markNotificationAsRead);

module.exports = router;
