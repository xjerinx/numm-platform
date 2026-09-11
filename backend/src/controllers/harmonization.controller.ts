import { Request, Response } from 'express';
import axios from 'axios';
import prisma from '../prisma';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const getWorkbenchCandidates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { offset = '0', limit = '20' } = req.query;
    const skip = parseInt(offset as string, 10) || 0;
    const take = parseInt(limit as string, 10) || 20;

    const [total, materials] = await Promise.all([
      prisma.material.count({
        where: { nmcCode: null },
      }),
      prisma.material.findMany({
        where: { nmcCode: null },
        skip,
        take,
        orderBy: { id: 'asc' },
      }),
    ]);

    res.json({
      data: materials,
      total,
      offset: skip,
      limit: take,
    });
  } catch (error: any) {
    console.error('getWorkbenchCandidates error:', error);
    res.status(500).json({ message: 'Failed to retrieve workbench items' });
  }
};

export const getAiHarmonizationSuggestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const material = await prisma.material.findUnique({ where: { id } });

    if (!material) {
      res.status(404).json({ message: 'Material not found' });
      return;
    }

    let unspscCode = material.unspscCommodity || '40151700';
    let unspscName = material.unspscName || 'Industrial Component';
    let confidence = material.confidenceScore || 0.85;

    // Standardized description rule: Title/Uppercase, remove abbreviations, add specs
    let cleanDesc = material.localDescription
      .toUpperCase()
      .replace(/\bASSY\b/g, 'ASSEMBLY')
      .replace(/\bMT\b/g, 'METRIC TON')
      .replace(/\bMTR\b/g, 'METER')
      .trim();

    // Standardized UOM
    const uomMap: { [key: string]: string } = {
      NOS: 'NUMBER (EA)',
      KG: 'KILOGRAM (KG)',
      BOX: 'BOX (BX)',
      SET: 'SET (ST)',
      MTR: 'METER (M)',
      MT: 'METRIC TON (T)',
      SQM: 'SQUARE METER (M2)',
    };
    const standardUom = uomMap[material.uom || 'NOS'] || material.uom || 'NUMBER (EA)';

    // Call AI Service if available to refine suggestion
    try {
      const aiRes = await axios.post(
        `${AI_SERVICE_URL}/classify`,
        { description: material.localDescription },
        { timeout: 3000 }
      );
      if (aiRes.data && aiRes.data.unspsc_code) {
        unspscCode = aiRes.data.unspsc_code;
        unspscName = aiRes.data.unspsc_name || unspscName;
        confidence = aiRes.data.confidence_score || confidence;
      }
    } catch (e) {
      // Graceful fallback to heuristic
    }

    const nmcSeq = Math.floor(1000 + Math.random() * 9000);
    const suggestedNmc = `NMC-${unspscCode.slice(0, 8)}-${nmcSeq}`;

    res.json({
      material,
      suggestion: {
        standardDescription: cleanDesc,
        unspscCode,
        unspscName,
        standardUom,
        confidenceScore: confidence,
        suggestedNmc,
      },
    });
  } catch (error: any) {
    console.error('getAiHarmonizationSuggestion error:', error);
    res.status(500).json({ message: 'Error generating harmonization suggestion' });
  }
};

export const approveHarmonization = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      materialId,
      nmcCode,
      standardDescription,
      unspscCode,
      unspscName,
      uom,
    } = req.body;

    if (!materialId || !nmcCode || !standardDescription) {
      res.status(400).json({ message: 'materialId, nmcCode, and standardDescription are required' });
      return;
    }

    const material = await prisma.material.findUnique({ where: { id: materialId } });
    if (!material) {
      res.status(404).json({ message: 'Material not found' });
      return;
    }

    // 1. Create or Find HarmonizedMaterial
    let harmonized = await prisma.harmonizedMaterial.findUnique({
      where: { nmcCode },
    });

    if (!harmonized) {
      harmonized = await prisma.harmonizedMaterial.create({
        data: {
          nmcCode,
          standardDescription,
          unspscCode: unspscCode || '40151700',
          unspscName: unspscName || 'Unified Component Standard',
          uom: uom || material.uom || 'NOS',
          approvedBy: req.user?.email || 'reviewer@numm.gov.in',
        },
      });
    }

    // 2. Create CPSE Mapping
    await prisma.cpseMapping.create({
      data: {
        harmonizedMaterialId: harmonized.id,
        cpseCode: material.cpseCode,
        localMaterialNumber: material.materialNumber,
      },
    });

    // 3. Update Material
    await prisma.material.update({
      where: { id: materialId },
      data: {
        nmcCode,
        status: 'Active',
        mappedBy: 'Reviewer-Harmonized',
        confidenceScore: 1.0,
      },
    });

    // 4. Write Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'ANONYMOUS',
        action: 'HARMONIZE_APPROVE',
        entity: 'HarmonizedMaterial',
        entityId: nmcCode,
        oldValue: JSON.stringify({
          materialNumber: material.materialNumber,
          cpseCode: material.cpseCode,
          localDescription: material.localDescription,
        }),
        newValue: JSON.stringify({
          nmcCode,
          standardDescription,
          unspscCode,
          uom,
        }),
      },
    });

    res.json({
      message: 'Material harmonized and National Material Code issued successfully',
      harmonized,
    });
  } catch (error: any) {
    console.error('approveHarmonization error:', error);
    res.status(500).json({ message: 'Failed to approve harmonization' });
  }
};

export const rejectHarmonization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { materialId, reason } = req.body;

    const material = await prisma.material.findUnique({ where: { id: materialId } });
    if (!material) {
      res.status(404).json({ message: 'Material not found' });
      return;
    }

    await prisma.material.update({
      where: { id: materialId },
      data: { status: 'Obsolete' },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'ANONYMOUS',
        action: 'HARMONIZE_REJECT',
        entity: 'Material',
        entityId: materialId,
        oldValue: JSON.stringify({ status: material.status }),
        newValue: JSON.stringify({ status: 'Obsolete', reason: reason || 'Reviewer rejected standardization' }),
      },
    });

    res.json({ message: 'Material rejected and marked as obsolete' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to reject material' });
  }
};
