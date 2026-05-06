import express from 'express';
import { body } from 'express-validator';

// ✅ Import ALL controller functions properly
import * as areaController from '../controllers/areaController.js';

import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.get('/', authenticate, areaController.getAllAreas);
router.get('/all', authenticate, areaController.getAllLocations);
router.get('/map/data', authenticate, areaController.getMapData);
router.get('/:id', authenticate, areaController.getAreaById);

router.post(
  '/add-location',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Area name is required'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    body('type').isIn(['hospital', 'residential', 'commercial', 'industrial', 'government']).withMessage('Invalid location type'),
    body('priority').isIn(['high', 'medium', 'low']).withMessage('Invalid priority level'),
    body('daily_demand_kl').isFloat({ min: 0 }).withMessage('Daily demand must be 0 or greater'),
  ],
  validate,
  areaController.addLocation
);

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

export default router;
