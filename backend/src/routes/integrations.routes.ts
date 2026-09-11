import { Router } from 'express';
import {
  getApiKeys,
  createApiKey,
  revokeApiKey,
  getWebhooks,
  createWebhook,
  deleteWebhook,
  testWebhook,
} from '../controllers/integrations.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// API Key management
router.get('/keys', authenticate, authorize(['SUPER_ADMIN']), getApiKeys);
router.post('/keys', authenticate, authorize(['SUPER_ADMIN']), createApiKey);
router.patch('/keys/:id/revoke', authenticate, authorize(['SUPER_ADMIN']), revokeApiKey);

// Webhooks
router.get('/webhooks', authenticate, getWebhooks);
router.post('/webhooks', authenticate, createWebhook);
router.delete('/webhooks/:id', authenticate, deleteWebhook);
router.post('/webhooks/:id/test', authenticate, testWebhook);

// OpenAPI Spec definition endpoint
router.get('/openapi.json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'National Unified Material Master (NUMM) External Integration API',
      version: '1.0.0',
      description: 'Standardized REST API for CPSE ERP (SAP S/4HANA, Oracle ERP) master data synchronization.',
    },
    servers: [{ url: 'http://localhost:4000/api' }],
    paths: {
      '/registry': {
        get: {
          summary: 'Query National Material Codes (NMCs)',
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'unspsc', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'List of approved NMCs with CPSE mappings' } },
        },
      },
      '/registry/{nmcCode}': {
        get: {
          summary: 'Fetch specific NMC record and all CPSE mappings',
          parameters: [{ name: 'nmcCode', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Full NMC details' } },
        },
      },
      '/materials': {
        get: {
          summary: 'Search material catalog across CPSEs',
          responses: { 200: { description: 'Paginated material catalog items' } },
        },
      },
    },
  });
});

export default router;
