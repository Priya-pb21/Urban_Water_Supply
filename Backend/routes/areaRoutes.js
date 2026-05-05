const express = require('express');
const { body } = require('express-validator');
const areaController = require('../controllers.js/areaController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/', authenticate, areaController.getAllAreas);
router.get('/map/data', authenticate, areaController.getMapData);
router.get('/:id', authenticate, areaController.getAreaById);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Area name is required'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    body('area_type').optional().isIn(['hospital', 'residential', 'commercial', 'industrial', 'school', 'government']),
  ],
  validate,
  areaController.createArea
);

router.put('/:id', authenticate, authorize('admin'), areaController.updateArea);
router.delete('/:id', authenticate, authorize('admin'), areaController.deleteArea);

module.exports = router;
