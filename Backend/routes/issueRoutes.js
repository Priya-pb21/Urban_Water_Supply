import express from 'express';
import { body } from 'express-validator';

// controllers
import {getAllIssues, getIssueById, createIssue, updateIssue, deleteIssue} from '../controllers/issueController.js';

// middleware
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.get('/', authenticate, getAllIssues);
router.get('/:id', authenticate, getIssueById);

router.post(
  '/',
  authenticate,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ],
  validate,
  createIssue
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  updateIssue
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  deleteIssue
);

export default router;