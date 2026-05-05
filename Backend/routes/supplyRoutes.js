const express = require('express');
const { body } = require('express-validator');
const supplyController = require('../controllers.js/supplyController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/', authenticate, supplyController.getAllSupply);
router.get('/today', authenticate, supplyController.getTodaySupply);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('total_water').isFloat({ gt: 0 }).withMessage('Total water must be greater than 0'),
    body('time_slot').isIn(['morning', 'afternoon', 'evening', 'night', 'all_day']).withMessage('Invalid time slot'),
  ],
  validate,
  supplyController.createSupply
);

router.put('/:id', authenticate, authorize('admin'), supplyController.updateSupply);

module.exports = router;
