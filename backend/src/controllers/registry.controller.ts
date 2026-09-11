import { Request, Response } from 'express';
import prisma from '../prisma';

export const getRegistry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, unspsc, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};

    if (search) {
      const q = (search as string).toLowerCase();
      where.OR = [
        { nmcCode: { contains: q } },
        { standardDescription: { contains: q } },
        { unspscCode: { contains: q } },
        { unspscName: { contains: q } },
      ];
    }

    if (unspsc && unspsc !== 'ALL') {
      where.unspscCode = { startsWith: unspsc as string };
    }

    const [total, records] = await Promise.all([
      prisma.harmonizedMaterial.count({ where }),
      prisma.harmonizedMaterial.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          mappings: true,
        },
        orderBy: { approvedAt: 'desc' },
      }),
    ]);

    // Format mapped CPSEs list
    const enriched = records.map((r) => {
      const cpseCodes = Array.from(new Set(r.mappings.map((m) => m.cpseCode)));
      return {
        ...r,
        mappedCpses: cpseCodes,
        totalMappings: r.mappings.length,
      };
    });

    res.json({
      data: enriched,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error('getRegistry error:', error);
    res.status(500).json({ message: 'Failed to retrieve registry items' });
  }
};

export const getNmcDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nmcCode } = req.params;

    const record = await prisma.harmonizedMaterial.findUnique({
      where: { nmcCode },
      include: {
        mappings: true,
      },
    });

    if (!record) {
      res.status(404).json({ message: 'NMC record not found' });
      return;
    }

    // Get material records for each mapping
    const localCodes = record.mappings.map((m) => m.localMaterialNumber);
    const rawMaterials = await prisma.material.findMany({
      where: { materialNumber: { in: localCodes } },
    });

    const matMap = new Map(rawMaterials.map((m) => [m.materialNumber, m]));

    const fullMappings = record.mappings.map((m) => ({
      ...m,
      materialDetails: matMap.get(m.localMaterialNumber) || null,
    }));

    res.json({
      data: {
        ...record,
        mappings: fullMappings,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to retrieve NMC details' });
  }
};

export const exportRegistryCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    const records = await prisma.harmonizedMaterial.findMany({
      include: { mappings: true },
      orderBy: { approvedAt: 'desc' },
    });

    const header = 'NMC_Code,Standard_Description,UNSPSC_Code,UNSPSC_Name,UOM,Approved_By,Approved_Date,Mapped_CPSEs,Mapped_Local_Codes\n';
    const rows = records.map((r) => {
      const cpseCodes = Array.from(new Set(r.mappings.map((m) => m.cpseCode))).join(';');
      const localCodes = r.mappings.map((m) => `${m.cpseCode}:${m.localMaterialNumber}`).join(';');
      return [
        r.nmcCode,
        `"${r.standardDescription.replace(/"/g, '""')}"`,
        r.unspscCode,
        `"${r.unspscName.replace(/"/g, '""')}"`,
        r.uom,
        r.approvedBy,
        r.approvedAt.toISOString(),
        `"${cpseCodes}"`,
        `"${localCodes}"`,
      ].join(',');
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="numm_national_registry.csv"');
    res.send(header + rows.join('\n'));
  } catch (error: any) {
    res.status(500).json({ message: 'Registry export failed' });
  }
};
