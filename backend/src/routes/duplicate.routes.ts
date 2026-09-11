import { Router } from 'express';
import {
  getDuplicatePairs,
  updateDuplicateStatus,
  bulkUpdateDuplicates,
  exportDuplicatesCsv,
} from '../controllers/duplicate.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getDuplicatePairs);
router.get('/export', authenticate, exportDuplicatesCsv);
router.patch('/:id', authenticate, updateDuplicateStatus);
router.post('/bulk', authenticate, bulkUpdateDuplicates);

export default router;
