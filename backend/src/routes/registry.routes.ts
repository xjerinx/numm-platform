import { Router } from 'express';
import {
  getRegistry,
  getNmcDetails,
  exportRegistryCsv,
} from '../controllers/registry.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getRegistry);
router.get('/export', authenticate, exportRegistryCsv);
router.get('/:nmcCode', authenticate, getNmcDetails);

export default router;
