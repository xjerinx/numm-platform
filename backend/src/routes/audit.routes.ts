import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getAuditLogs);

export default router;
