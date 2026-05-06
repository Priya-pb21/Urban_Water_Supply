import express from 'express';
import { body } from 'express-validator';

// import all controller functions
import * as demandController from '../controllers/demandController.js';

// middleware
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.get('/', authenticate, demandController.getAllDemand);
router.get('/summary', authenticate, demandController.getDemandSummary);

router.post(
  '/',
  authenticate,
  authorize('admin', 'area_manager'),
  [
    body('area_id').isUUID().withMessage('Valid area_id is required'),
    body('quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
    body('priority').isInt({ min: 1, max: 10 }).withMessage('Priority must be between 1 and 10'),
  ],
  validate,
  demandController.createDemand
);

router.patch(
  '/:id/approve',
  authenticate,
  authorize('admin'),
  demandController.approveDemand
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'area_manager'),
  demandController.updateDemand
);

export default router;
