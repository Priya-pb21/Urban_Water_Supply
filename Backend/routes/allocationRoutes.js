const express = require('express');
const { body } = require('express-validator');
const allocationController = require('../controllers.js/allocationController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/', authenticate, allocationController.getAllAllocations);
router.get('/dashboard', authenticate, authorize('admin'), allocationController.getDashboard);
router.get('/history/:area_id', authenticate, allocationController.getAreaHistory);

router.post(
  '/run',
  authenticate,
  authorize('admin'),
  [body('supply_id').isUUID().withMessage('Valid supply_id is required')],
  validate,
  allocationController.runAllocation
);

module.exports = router;
