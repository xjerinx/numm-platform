import { Router } from 'express';
import {
  previewCsv,
  confirmUpload,
  getUploadHistory,
  uploadMiddleware,
} from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/preview', authenticate, uploadMiddleware, previewCsv);
router.post('/confirm', authenticate, confirmUpload);
router.get('/history', authenticate, getUploadHistory);

export default router;
