const express = require('express');
const { body } = require('express-validator');
const issueController = require('../controllers.js/issueController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/', authenticate, issueController.getAllIssues);

router.post(
  '/',
  authenticate,
  [
    body('area_id').isUUID().withMessage('Valid area_id is required'),
    body('issue_type').isIn(['no_supply', 'leakage', 'water_breakout', 'contamination', 'low_pressure', 'other']).withMessage('Invalid issue type'),
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
  [body('status').isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status')],
  validate,
  issueController.updateIssueStatus
);

module.exports = router;
