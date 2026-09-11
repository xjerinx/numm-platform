import { Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import prisma from '../prisma';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

export const uploadMiddleware = upload.single('file');

// In-memory upload session cache for previewing before confirm
const uploadSessions = new Map<string, { rows: any[]; originalHeaders: string[]; filename: string }>();

// In-memory upload history logs
const uploadHistory: Array<{
  id: string;
  filename: string;
  cpseCode: string;
  totalRows: number;
  status: 'Processing' | 'Done' | 'Failed';
  uploadedBy: string;
  createdAt: string;
}> = [
  {
    id: 'UPL-001',
    filename: 'cpse_material_master_synthetic.csv',
    cpseCode: 'MULTI-CPSE',
    totalRows: 909,
    status: 'Done',
    uploadedBy: 'admin@numm.gov.in',
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
];

export const previewCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No CSV file uploaded' });
      return;
    }

    const content = req.file.buffer.toString('utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (records.length === 0) {
      res.status(400).json({ message: 'CSV file is empty or formatted incorrectly' });
      return;
    }

    const headers = Object.keys(records[0] || {});
    const sessionId = `SESSION-${Date.now()}`;

    // Store in cache for confirm
    uploadSessions.set(sessionId, {
      rows: records,
      originalHeaders: headers,
      filename: req.file.originalname,
    });

    const previewRows = records.slice(0, 10);

    res.json({
      sessionId,
      filename: req.file.originalname,
      totalRows: records.length,
      headers,
      preview: previewRows,
      suggestedMapping: {
        materialNumber: headers.find((h) => /material.*number|mat.*no|code|item.*id/i.test(h)) || headers[0],
        localDescription: headers.find((h) => /desc|title|name|material.*desc/i.test(h)) || headers[1],
        localClassCode: headers.find((h) => /class|group|cat/i.test(h)) || '',
        uom: headers.find((h) => /uom|unit/i.test(h)) || '',
        status: headers.find((h) => /status|state/i.test(h)) || '',
        cpseCode: headers.find((h) => /cpse|company|org/i.test(h)) || '',
      },
    });
  } catch (error: any) {
    console.error('previewCsv error:', error);
    res.status(500).json({ message: 'Failed to parse CSV file: ' + error.message });
  }
};

export const confirmUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, columnMapping, cpseCodeFallback } = req.body;

    const session = uploadSessions.get(sessionId);
    if (!session) {
      res.status(404).json({ message: 'Upload session expired or not found. Please upload again.' });
      return;
    }

    const { rows, filename } = session;
    const historyItem: {
      id: string;
      filename: string;
      cpseCode: string;
      totalRows: number;
      status: 'Processing' | 'Done' | 'Failed';
      uploadedBy: string;
      createdAt: string;
    } = {
      id: `UPL-${Date.now().toString().slice(-4)}`,
      filename,
      cpseCode: req.user?.cpseCode || cpseCodeFallback || 'ONGC',
      totalRows: rows.length,
      status: 'Processing',
      uploadedBy: req.user?.email || 'admin@numm.gov.in',
      createdAt: new Date().toISOString(),
    };
    uploadHistory.unshift(historyItem);

    // Process rows
    let insertedCount = 0;
    for (const r of rows) {
      const matNumber = r[columnMapping.materialNumber] || `MAT-${Math.floor(100000 + Math.random() * 900000)}`;
      const desc = r[columnMapping.localDescription] || 'No Description';
      const cpse = r[columnMapping.cpseCode] || req.user?.cpseCode || cpseCodeFallback || 'ONGC';
      const uom = r[columnMapping.uom] || 'NOS';
      const status = r[columnMapping.status] || 'Active';
      const classCode = columnMapping.localClassCode ? r[columnMapping.localClassCode] : null;

      await prisma.material.create({
        data: {
          materialNumber: String(matNumber),
          localDescription: String(desc),
          cpseCode: String(cpse),
          uom: String(uom),
          status: String(status),
          localClassCode: classCode ? String(classCode) : null,
          mappedBy: 'CSV-Upload',
        },
      });
      insertedCount++;
    }

    historyItem.status = 'Done';
    uploadSessions.delete(sessionId);

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'ANONYMOUS',
        action: 'CSV_UPLOAD_CONFIRM',
        entity: 'Material',
        entityId: historyItem.id,
        oldValue: null,
        newValue: JSON.stringify({ filename, insertedCount, cpse: historyItem.cpseCode }),
      },
    });

    res.json({
      message: `Successfully imported ${insertedCount} materials.`,
      historyItem,
    });
  } catch (error: any) {
    console.error('confirmUpload error:', error);
    res.status(500).json({ message: 'Failed to process CSV data: ' + error.message });
  }
};

export const getUploadHistory = async (req: Request, res: Response): Promise<void> => {
  res.json({ history: uploadHistory });
};
