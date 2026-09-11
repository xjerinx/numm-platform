import { Router } from 'express';
import {
  getDashboardStats,
  getAnalyticsData,
  calculateSavings,
} from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authenticate, getDashboardStats);
router.get('/reports', authenticate, getAnalyticsData);
router.post('/savings-calc', authenticate, calculateSavings);

export default router;
