import express from 'express';
import { body } from 'express-validator';
import pool from '../config/db.js';

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

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'area_manager'),
  demandController.updateDemand, 
);

router.get('/getdemand',
  authenticate,
  authorize('admin', 'area_manager'),
async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(quantity), 0) AS total_demand,
        COUNT(*) AS total_requests
      FROM demand
      WHERE DATE(timestamp) = CURRENT_DATE
    `);

    res.json({
      success: true,
      data: {
        total_demand: Number(result.rows[0].total_demand),
        total_requests: Number(result.rows[0].total_requests),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;