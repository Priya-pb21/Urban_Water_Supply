import express from 'express';
import { body } from 'express-validator';

// controllers
import * as issueController from '../controllers/issueController.js';

// middleware
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.get('/', authenticate, issueController.getAllIssues);
router.get('/:id', authenticate, issueController.getIssueById);

router.post(
  '/',
  authenticate,
  [
    body('area_id').isUUID().withMessage('Valid area_id is required'),
    body('issue_type')
      .isIn(['no_supply', 'leakage', 'water_breakout', 'contamination', 'low_pressure', 'other'])
      .withMessage('Invalid issue type'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  ],
  validate,
  issueController.createIssue
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('admin', 'area_manager'),
  [
    body('status').isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),
  ],
  validate,
  issueController.updateIssueStatus
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  issueController.updateIssue
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  issueController.deleteIssue
);

export default router;
