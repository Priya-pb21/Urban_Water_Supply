import express from 'express';
import { body } from 'express-validator';
import {
  runAllocation,
  getAllAllocations,
  getDashboard,
  getAreaHistory,
  getAllocationLog,
} from '../controllers/allocationController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.get('/', authenticate, getAllAllocations);
router.get('/dashboard', authenticate, authorize('admin'), getDashboard);
router.get('/history/:area_id', authenticate, getAreaHistory);
router.get('/log', authenticate, authorize('admin'), getAllocationLog);

router.post(
  '/run',
  authenticate,
  authorize('admin'),
  [
    body('supply_id').isUUID().withMessage('Valid supply_id is required'),
    body('date').optional().isISO8601().withMessage('Valid date is required'),
  ],
  validate,
  runAllocation
);

export default router;
