import express from 'express';
import { body } from 'express-validator';

// import controller functions
import * as supplyController from '../controllers/supplyController.js';

// middleware
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.get('/', authenticate, supplyController.getAllSupply);
router.get('/today', authenticate, supplyController.getTodaySupply);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('total_water')
      .isFloat({ gt: 0 })
      .withMessage('Total water must be greater than 0'),
    body('time_slot')
      .isIn(['morning', 'afternoon', 'evening', 'night', 'all_day'])
      .withMessage('Invalid time slot'),
  ],
  validate,
  supplyController.createSupply
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  supplyController.updateSupply
);

export default router;