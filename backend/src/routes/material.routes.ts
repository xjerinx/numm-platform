import { Router } from 'express';
import {
  getMaterials,
  getMaterialById,
  runAiMatchingJob,
  getAiServiceStatus,
} from '../controllers/material.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getMaterials);
router.get('/status/ai', authenticate, getAiServiceStatus);
router.post('/match-job', authenticate, runAiMatchingJob);
router.get('/:id', authenticate, getMaterialById);

export default router;
