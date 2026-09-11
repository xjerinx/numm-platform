import { Request, Response } from 'express';
import prisma from '../prisma';
import { enqueueAiJob, checkAiServiceHealth } from '../jobs/aiQueue';

export const getMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '25',
      cpse,
      status,
      search,
      unmappedOnly,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};

    // Role filtering: CPSE Analyst only sees their own CPSE materials if restricted
    if (req.user?.role === 'CPSE_ANALYST' && req.user.cpseCode) {
      where.cpseCode = req.user.cpseCode;
    } else if (cpse && cpse !== 'ALL') {
      where.cpseCode = cpse as string;
    }

    if (status && status !== 'ALL') {
      where.status = status as string;
    }

    if (unmappedOnly === 'true') {
      where.nmcCode = null;
    }

    if (search) {
      const q = (search as string).toLowerCase();
      where.OR = [
        { materialNumber: { contains: q } },
        { localDescription: { contains: q } },
        { unspscName: { contains: q } },
      ];
    }

    const [total, materials] = await Promise.all([
      prisma.material.count({ where }),
      prisma.material.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      data: materials,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error('getMaterials error:', error);
    res.status(500).json({ message: 'Failed to retrieve materials' });
  }
};

export const getMaterialById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const material = await prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      res.status(404).json({ message: 'Material not found' });
      return;
    }

    res.json({ data: material });
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving material' });
  }
};

export const runAiMatchingJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const cpseCode = req.user?.role === 'CPSE_ANALYST' ? req.user.cpseCode || undefined : undefined;
    const result = await enqueueAiJob('FULL_DEDUPLICATION_MATCHING', cpseCode);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to trigger AI matching job' });
  }
};

export const getAiServiceStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const online = await checkAiServiceHealth();
    res.json({ online, service: 'NUMM Python FastAPI AI Engine' });
  } catch (error: any) {
    res.json({ online: false, error: error.message });
  }
};
