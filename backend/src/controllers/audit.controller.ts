import { Request, Response } from 'express';
import prisma from '../prisma';

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, entity, search, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};

    if (action && action !== 'ALL') {
      where.action = { contains: action as string };
    }

    if (entity && entity !== 'ALL') {
      where.entity = entity as string;
    }

    if (search) {
      const q = (search as string).toLowerCase();
      where.OR = [
        { userId: { contains: q } },
        { action: { contains: q } },
        { entityId: { contains: q } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Parse JSON values for frontend convenience
    const parsedLogs = logs.map((log) => ({
      ...log,
      oldValueParsed: log.oldValue ? tryParseJson(log.oldValue) : null,
      newValueParsed: log.newValue ? tryParseJson(log.newValue) : null,
    }));

    res.json({
      data: parsedLogs,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error('getAuditLogs error:', error);
    res.status(500).json({ message: 'Failed to retrieve audit trail' });
  }
};

function tryParseJson(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}
