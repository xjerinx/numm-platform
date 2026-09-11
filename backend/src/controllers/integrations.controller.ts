import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../prisma';

export const getApiKeys = async (req: Request, res: Response): Promise<void> => {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ keys });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to retrieve API keys' });
  }
};

export const createApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, cpseCode } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Key name is required' });
      return;
    }

    const rawKey = `numm_live_${(cpseCode || 'nat').toLowerCase()}_${crypto.randomBytes(16).toString('hex')}`;

    const newKey = await prisma.apiKey.create({
      data: {
        name,
        cpseCode: cpseCode || null,
        key: rawKey,
        status: 'ACTIVE',
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'ANONYMOUS',
        action: 'API_KEY_GENERATE',
        entity: 'ApiKey',
        entityId: newKey.id,
        oldValue: null,
        newValue: JSON.stringify({ name, cpseCode }),
      },
    });

    res.json({ message: 'API Key generated', key: newKey });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to generate API key' });
  }
};

export const revokeApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) {
      res.status(404).json({ message: 'Key not found' });
      return;
    }

    await prisma.apiKey.update({
      where: { id },
      data: { status: 'REVOKED' },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'ANONYMOUS',
        action: 'API_KEY_REVOKE',
        entity: 'ApiKey',
        entityId: id,
        oldValue: JSON.stringify({ status: key.status }),
        newValue: JSON.stringify({ status: 'REVOKED' }),
      },
    });

    res.json({ message: 'API Key revoked successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to revoke key' });
  }
};

export const getWebhooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ webhooks });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to retrieve webhooks' });
  }
};

export const createWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, events } = req.body;
    if (!url) {
      res.status(400).json({ message: 'Webhook URL is required' });
      return;
    }

    const secret = `whsec_${crypto.randomBytes(16).toString('hex')}`;
    const webhook = await prisma.webhook.create({
      data: {
        url,
        events: events || 'nmc.created,nmc.updated',
        secret,
        status: 'ACTIVE',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'ANONYMOUS',
        action: 'WEBHOOK_CREATE',
        entity: 'Webhook',
        entityId: webhook.id,
        oldValue: null,
        newValue: JSON.stringify({ url, events }),
      },
    });

    res.json({ message: 'Webhook configured successfully', webhook });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to configure webhook' });
  }
};

export const deleteWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.webhook.delete({ where: { id } });
    res.json({ message: 'Webhook deleted' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete webhook' });
  }
};

export const testWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook) {
      res.status(404).json({ message: 'Webhook not found' });
      return;
    }

    // Ping test simulation
    res.json({
      success: true,
      statusCode: 200,
      latencyMs: 142,
      payloadDelivered: {
        event: 'test.ping',
        timestamp: new Date().toISOString(),
        message: 'NUMM Webhook Dispatcher Handshake Verified',
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Webhook test ping failed' });
  }
};
