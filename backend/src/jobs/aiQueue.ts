import Bull from 'bull';
import axios from 'axios';
import Redis from 'ioredis';
import { Server as SocketIOServer } from 'socket.io';
import prisma from '../prisma';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

let ioInstance: SocketIOServer | null = null;
let aiQueue: Bull.Queue | null = null;
let isRedisConnected = false;

export const initSocketIO = (io: SocketIOServer) => {
  ioInstance = io;
};

// Test AI Service connectivity
export const checkAiServiceHealth = async (): Promise<boolean> => {
  try {
    const res = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 2000 });
    return res.status === 200;
  } catch (err) {
    return false;
  }
};

// Initialize Bull Queue safely with fallback
export const initAiQueue = async () => {
  try {
    // Probe Redis with a quick non-crashing probe
    const testRedis = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      connectTimeout: 1500,
      maxRetriesPerRequest: 0,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    testRedis.on('error', () => {
      // Suppress connection error
    });

    await testRedis.connect().catch(() => null);

    if (testRedis.status === 'ready') {
      aiQueue = new Bull('ai-matching-queue', {
        redis: {
          host: REDIS_HOST,
          port: REDIS_PORT,
          maxRetriesPerRequest: 1,
        },
      });

      aiQueue.on('error', (err) => {
        console.warn('⚠️ Bull Queue warning:', err.message);
      });

      aiQueue.process(async (job) => {
        return await executeAiJob(job.data, (progress) => job.progress(progress));
      });

      isRedisConnected = true;
      console.log('✅ Bull Queue initialized with active Redis server.');
      testRedis.disconnect();
    } else {
      console.log('ℹ️ Redis is not active locally. Operating with high-performance In-Memory AI Job Worker.');
      isRedisConnected = false;
      testRedis.disconnect();
    }
  } catch (err) {
    console.log('ℹ️ Operating with In-Memory AI Job Worker.');
    isRedisConnected = false;
  }
};

// Core AI Job Processor
async function executeAiJob(
  jobData: { jobId: string; type: string; cpseCode?: string },
  progressCallback?: (p: number) => void
) {
  const { jobId, type, cpseCode } = jobData;
  console.log(`🤖 Processing AI Job: ${jobId} (Type: ${type})`);

  const emitProgress = (percent: number, message: string) => {
    if (progressCallback) progressCallback(percent);
    if (ioInstance) {
      ioInstance.emit('ai_job_progress', {
        jobId,
        percent,
        message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  emitProgress(10, 'Fetching CPSE material catalogs for cross-analysis...');

  const whereClause: any = {};
  if (cpseCode) whereClause.cpseCode = cpseCode;
  const materials = await prisma.material.findMany({
    where: whereClause,
    take: 300,
  });

  emitProgress(35, `Analyzing ${materials.length} material descriptions across CPSEs...`);

  const isAiOnline = await checkAiServiceHealth();
  let duplicateCount = 0;

  if (isAiOnline) {
    emitProgress(55, 'Sending embeddings to Python FastAPI Matching Service...');
    try {
      const payload = materials.map((m) => ({
        id: m.id,
        description: m.localDescription,
        cpseCode: m.cpseCode,
        unspscClass: m.unspscCommodity ? m.unspscCommodity.slice(0, 6) + '00' : '40151700',
      }));

      const aiResponse = await axios.post(
        `${AI_SERVICE_URL}/detect-duplicates`,
        { materials: payload, threshold: 0.6 },
        { timeout: 15000 }
      );

      const pairs = aiResponse.data.duplicate_pairs || [];
      emitProgress(80, `Saving ${pairs.length} detected duplicate pairs into database...`);

      for (const pair of pairs) {
        const existing = await prisma.duplicatePair.findFirst({
          where: {
            OR: [
              { materialAId: pair.material_a_id, materialBId: pair.material_b_id },
              { materialAId: pair.material_b_id, materialBId: pair.material_a_id },
            ],
          },
        });

        if (!existing) {
          await prisma.duplicatePair.create({
            data: {
              materialAId: pair.material_a_id,
              materialBId: pair.material_b_id,
              similarity: pair.similarity,
              suggestedNmc: pair.suggested_nmc || `NMC-40150000-${Math.floor(1000 + Math.random() * 9000)}`,
              status: 'PENDING',
            },
          });
          duplicateCount++;
        }
      }
    } catch (err: any) {
      console.warn('AI Service call failed during job, running built-in text-similarity fallback:', err.message);
      duplicateCount = await runBuiltInSimilarityEngine(materials, emitProgress);
    }
  } else {
    emitProgress(60, 'AI Service offline: using built-in n-gram & token similarity engine...');
    duplicateCount = await runBuiltInSimilarityEngine(materials, emitProgress);
  }

  emitProgress(100, `AI Matching completed! Found ${duplicateCount} cross-CPSE candidate duplicates.`);

  if (ioInstance) {
    ioInstance.emit('ai_job_completed', {
      jobId,
      status: 'COMPLETED',
      duplicatesFound: duplicateCount,
      timestamp: new Date().toISOString(),
    });
  }

  // Record Audit Log
  await prisma.auditLog.create({
    data: {
      userId: 'SYSTEM_AI_ENGINE',
      action: 'BATCH_DUPLICATE_DETECTION',
      entity: 'DuplicatePair',
      entityId: jobId,
      oldValue: null,
      newValue: JSON.stringify({ duplicatesFound: duplicateCount, jobType: type }),
    },
  });

  return { jobId, duplicateCount };
}

// Built-in Token Similarity Fallback Engine
async function runBuiltInSimilarityEngine(
  materials: any[],
  emitProgress: (p: number, msg: string) => void
): Promise<number> {
  let created = 0;
  const map: { [token: string]: any[] } = {};
  materials.forEach((m) => {
    const tokens = m.localDescription
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(/\s+/)
      .filter(Boolean);
    const key = tokens.slice(0, 2).join(' ') || 'misc';
    if (!map[key]) map[key] = [];
    map[key].push(m);
  });

  for (const key of Object.keys(map)) {
    const group = map[key];
    if (group.length > 1) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const a = group[i];
          const b = group[j];
          if (a.cpseCode !== b.cpseCode) {
            const sim = calculateJaccardSimilarity(a.localDescription, b.localDescription);
            if (sim >= 0.5) {
              const existing = await prisma.duplicatePair.findFirst({
                where: {
                  OR: [
                    { materialAId: a.id, materialBId: b.id },
                    { materialAId: b.id, materialBId: a.id },
                  ],
                },
              });
              if (!existing) {
                await prisma.duplicatePair.create({
                  data: {
                    materialAId: a.id,
                    materialBId: b.id,
                    similarity: Math.round(sim * 100) / 100,
                    suggestedNmc: `NMC-41110000-${Math.floor(1000 + Math.random() * 9000)}`,
                    status: 'PENDING',
                  },
                });
                created++;
              }
            }
          }
        }
      }
    }
  }
  return created;
}

function calculateJaccardSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.toLowerCase().split(/\s+/).filter(Boolean));
  const set2 = new Set(str2.toLowerCase().split(/\s+/).filter(Boolean));
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// Public Dispatcher
export const enqueueAiJob = async (type: string, cpseCode?: string) => {
  const jobId = `JOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  if (aiQueue && isRedisConnected) {
    await aiQueue.add({ jobId, type, cpseCode });
  } else {
    setImmediate(() => {
      executeAiJob({ jobId, type, cpseCode });
    });
  }

  return { jobId, status: 'QUEUED', message: 'AI Job queued successfully' };
};
