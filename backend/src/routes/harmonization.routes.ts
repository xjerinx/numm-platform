import { Router } from 'express';
import {
  getWorkbenchCandidates,
  getAiHarmonizationSuggestion,
  approveHarmonization,
  rejectHarmonization,
} from '../controllers/harmonization.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/candidates', authenticate, getWorkbenchCandidates);
router.get('/suggest/:id', authenticate, getAiHarmonizationSuggestion);
router.post('/approve', authenticate, approveHarmonization);
router.post('/reject', authenticate, rejectHarmonization);

export default router;
