import { Request, Response } from 'express';
import prisma from '../prisma';

export const getDuplicatePairs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status = 'ALL',
      minSimilarity = '0',
      cpse = 'ALL',
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * pageSize;
    const minSim = parseFloat(minSimilarity as string) / 100;

    const where: any = {
      similarity: { gte: minSim },
    };

    if (status !== 'ALL') {
      where.status = status;
    }

    const [total, pairs] = await Promise.all([
      prisma.duplicatePair.count({ where }),
      prisma.duplicatePair.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { similarity: 'desc' },
      }),
    ]);

    // Fetch details of materialA and materialB
    const materialIds = Array.from(
      new Set(pairs.flatMap((p) => [p.materialAId, p.materialBId]))
    );

    const materials = await prisma.material.findMany({
      where: { id: { in: materialIds } },
    });

    const matMap = new Map(materials.map((m) => [m.id, m]));

    let enrichedPairs = pairs.map((pair) => ({
      ...pair,
      materialA: matMap.get(pair.materialAId) || null,
      materialB: matMap.get(pair.materialBId) || null,
    }));

    // CPSE filter applies to either A or B
    if (cpse !== 'ALL') {
      enrichedPairs = enrichedPairs.filter(
        (p) =>
          p.materialA?.cpseCode === cpse || p.materialB?.cpseCode === cpse
      );
    }

    res.json({
      data: enrichedPairs,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error('getDuplicatePairs error:', error);
    res.status(500).json({ message: 'Failed to retrieve duplicate pairs' });
  }
};

export const updateDuplicateStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, suggestedNmc } = req.body; // 'APPROVED' | 'REJECTED'

    const pair = await prisma.duplicatePair.findUnique({ where: { id } });
    if (!pair) {
      res.status(404).json({ message: 'Duplicate pair not found' });
      return;
    }

    const updated = await prisma.duplicatePair.update({
      where: { id },
      data: {
        status,
        suggestedNmc: suggestedNmc || pair.suggestedNmc,
        reviewedBy: req.user?.email || 'reviewer@numm.gov.in',
        reviewedAt: new Date(),
      },
    });

    // If APPROVED, link materials to harmonized NMC
    if (status === 'APPROVED' && updated.suggestedNmc) {
      const matA = await prisma.material.findUnique({ where: { id: pair.materialAId } });
      const matB = await prisma.material.findUnique({ where: { id: pair.materialBId } });

      if (matA && matB) {
        // Upsert Harmonized Material
        let harmonized = await prisma.harmonizedMaterial.findUnique({
          where: { nmcCode: updated.suggestedNmc },
        });

        if (!harmonized) {
          harmonized = await prisma.harmonizedMaterial.create({
            data: {
              nmcCode: updated.suggestedNmc,
              standardDescription: matA.localDescription.toUpperCase(),
              unspscCode: matA.unspscCommodity || '40151700',
              unspscName: matA.unspscName || 'Standardized Equipment Component',
              uom: matA.uom || 'NOS',
              approvedBy: req.user?.email || 'reviewer@numm.gov.in',
            },
          });
        }

        // Add CPSE Mappings
        await prisma.cpseMapping.createMany({
          data: [
            {
              harmonizedMaterialId: harmonized.id,
              cpseCode: matA.cpseCode,
              localMaterialNumber: matA.materialNumber,
            },
            {
              harmonizedMaterialId: harmonized.id,
              cpseCode: matB.cpseCode,
              localMaterialNumber: matB.materialNumber,
            },
          ],
        });

        // Update Materials with NMC
        await prisma.material.update({
          where: { id: matA.id },
          data: { nmcCode: updated.suggestedNmc },
        });
        await prisma.material.update({
          where: { id: matB.id },
          data: { nmcCode: updated.suggestedNmc },
        });
      }
    }

    // Write to AuditLog
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'ANONYMOUS',
        action: `DUPLICATE_${status}`,
        entity: 'DuplicatePair',
        entityId: id,
        oldValue: JSON.stringify({ status: pair.status }),
        newValue: JSON.stringify({ status, suggestedNmc: updated.suggestedNmc }),
      },
    });

    res.json({ message: `Pair successfully ${status.toLowerCase()}`, data: updated });
  } catch (error: any) {
    console.error('updateDuplicateStatus error:', error);
    res.status(500).json({ message: 'Error updating duplicate pair status' });
  }
};

export const bulkUpdateDuplicates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, action } = req.body; // action: 'APPROVE' | 'REJECT'
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'ids array is required' });
      return;
    }

    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    await prisma.duplicatePair.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        reviewedBy: req.user?.email || 'reviewer@numm.gov.in',
        reviewedAt: new Date(),
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'ANONYMOUS',
        action: `BULK_DUPLICATE_${status}`,
        entity: 'DuplicatePair',
        entityId: `COUNT_${ids.length}`,
        oldValue: null,
        newValue: JSON.stringify({ count: ids.length, action }),
      },
    });

    res.json({ message: `Bulk ${action.toLowerCase()} applied to ${ids.length} records.` });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to apply bulk duplicate action' });
  }
};

export const exportDuplicatesCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    const pairs = await prisma.duplicatePair.findMany({
      orderBy: { similarity: 'desc' },
      take: 500,
    });

    const materialIds = Array.from(new Set(pairs.flatMap((p) => [p.materialAId, p.materialBId])));
    const materials = await prisma.material.findMany({ where: { id: { in: materialIds } } });
    const map = new Map(materials.map((m) => [m.id, m]));

    const header = 'Pair_ID,CPSE_A,Material_A,Desc_A,CPSE_B,Material_B,Desc_B,Similarity_Pct,Suggested_NMC,Status\n';
    const rows = pairs.map((p) => {
      const a = map.get(p.materialAId);
      const b = map.get(p.materialBId);
      return [
        p.id,
        a?.cpseCode || '',
        a?.materialNumber || '',
        `"${(a?.localDescription || '').replace(/"/g, '""')}"`,
        b?.cpseCode || '',
        b?.materialNumber || '',
        `"${(b?.localDescription || '').replace(/"/g, '""')}"`,
        `${Math.round(p.similarity * 100)}%`,
        p.suggestedNmc || '',
        p.status,
      ].join(',');
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="numm_duplicates_export.csv"');
    res.send(header + rows.join('\n'));
  } catch (error: any) {
    res.status(500).json({ message: 'Export failed' });
  }
};
