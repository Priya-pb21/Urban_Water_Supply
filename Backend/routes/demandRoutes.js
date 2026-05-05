const express = require('express');
const { body } = require('express-validator');
const demandController = require('../controllers.js/demandController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

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

router.put('/:id', authenticate, authorize('admin', 'area_manager'), demandController.updateDemand);

module.exports = router;
