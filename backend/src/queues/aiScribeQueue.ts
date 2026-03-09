/**
 * BullMQ queue for AI Scribe processing.
 * Queue name: ai-scribe-processing
 * Worker steps: transcribe (Whisper) -> generate SOAP (GPT) -> update session -> create VisitNoteVersion
 */

import { Queue, Worker, Job } from 'bullmq';
import OpenAI from 'openai';
import prisma from '../config/prisma';
import * as aiScribeService from '../services/aiScribeService';
import * as openaiService from '../services/openaiService';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import os from 'os';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

function parseRedisUrl(url: string) {
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: parseInt(u.port || '6379', 10),
      password: u.password || undefined,
    };
  } catch {
    return connection;
  }
}

const redisConfig = process.env.REDIS_URL ? parseRedisUrl(REDIS_URL) : connection;

export const AI_SCRIBE_QUEUE_NAME = 'ai-scribe-processing';

export const aiScribeQueue = new Queue(AI_SCRIBE_QUEUE_NAME, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
  },
});

export interface AiScribeJobData {
  sessionId: string;
}

function logStructured(
  event: string,
  data: Record<string, string | number | undefined>
) {
  const parts = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');
  console.log(`[AI Scribe] ${event} ${parts}`);
}

async function fetchAudioBuffer(audioUrl: string): Promise<Buffer> {
  if (audioUrl.startsWith('/uploads/') || audioUrl.startsWith('uploads/')) {
    const normalized = audioUrl.startsWith('/') ? audioUrl.slice(1) : audioUrl;
    const fullPath = path.join(process.cwd(), normalized);
    return fs.readFileSync(fullPath);
  }
  if (audioUrl.startsWith('http')) {
    return new Promise((resolve, reject) => {
      const client = audioUrl.startsWith('https') ? https : http;
      client
        .get(audioUrl, (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        })
        .on('error', reject);
    });
  }
  throw new Error('Invalid audio URL');
}

async function transcribeWithWhisper(buffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  const openai = new OpenAI({ apiKey });
  const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp3') ? 'mp3' : 'webm';
  const tmpPath = path.join(os.tmpdir(), `whisper-${Date.now()}.${ext}`);
  fs.writeFileSync(tmpPath, buffer);
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tmpPath),
      model: 'whisper-1',
    });
    return transcription.text;
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // ignore
    }
  }
}

async function generateSoapDraft(transcript: string): Promise<aiScribeService.SoapDraft> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'system',
        content: `Convert this medical conversation into a structured SOAP note.
Return valid JSON only, no markdown or extra text:
{
  "subjective": "",
  "objective": "",
  "assessment": "",
  "plan": ""
}`,
      },
      {
        role: 'user',
        content: transcript,
      },
    ],
    response_format: { type: 'json_object' },
  });
  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('No response from GPT');
  const parsed = JSON.parse(text) as aiScribeService.SoapDraft;
  return {
    subjective: String(parsed.subjective ?? ''),
    objective: String(parsed.objective ?? ''),
    assessment: String(parsed.assessment ?? ''),
    plan: String(parsed.plan ?? ''),
  };
}

async function processAiScribeJob(job: Job<AiScribeJobData>) {
  const { sessionId } = job.data;
  const startTime = Date.now();

  const session = await prisma.aIScribeSession.findUnique({
    where: { id: sessionId },
    include: { provider: { select: { userId: true } } },
  });
  if (!session || !session.audioUrl) {
    throw new Error('Session or audio not found');
  }

  if (session.status === 'APPROVED') {
    throw new Error('This session has already been finalized.');
  }

  const visitRecordId = session.visitRecordId;
  const providerId = session.providerId;

  try {
    await prisma.aIScribeSession.update({
      where: { id: sessionId },
      data: { processingStartedAt: new Date(), errorMessage: null },
    });
  } catch (err) {
    logStructured('Processing Start Failed', {
      sessionId,
      visitRecordId,
      providerId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  await job.updateProgress(10);

  try {
    await prisma.aIScribeSession.update({
      where: { id: sessionId },
      data: { status: 'TRANSCRIBING' },
    });
  } catch {
    // non-fatal
  }

  const buffer = await fetchAudioBuffer(session.audioUrl);
  const mimeType = 'audio/webm';
  await job.updateProgress(30);

  const transcript = await transcribeWithWhisper(buffer, mimeType);
  await prisma.aIScribeSession.update({
    where: { id: sessionId },
    data: { transcript },
  });
  await job.updateProgress(50);

  const soapDraft = await generateSoapDraft(transcript);
  await prisma.aIScribeSession.update({
    where: { id: sessionId },
    data: {
      aiDraft: soapDraft as object,
      status: 'DRAFT_GENERATED',
      processingCompletedAt: new Date(),
      aiModel: OPENAI_MODEL,
      errorMessage: null,
    },
  });
  await job.updateProgress(80);

  const patientSummary = await openaiService.generatePatientSummary(soapDraft);
  await prisma.aIScribeSession.update({
    where: { id: sessionId },
    data: { patientSummary: patientSummary as object },
  });

  await aiScribeService.saveDraftAsVisitNoteVersion(sessionId, soapDraft);
  await job.updateProgress(100);

  const duration = Math.round((Date.now() - startTime) / 1000);
  logStructured('Processing Completed', {
    sessionId,
    visitRecordId,
    providerId,
    duration: `${duration}s`,
    model: OPENAI_MODEL,
  });
}

export function createAiScribeWorker(): Worker<AiScribeJobData> {
  const worker = new Worker<AiScribeJobData>(
    AI_SCRIBE_QUEUE_NAME,
    async (job) => {
      const { sessionId } = job.data;
      try {
        await processAiScribeJob(job);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const session = await prisma.aIScribeSession.findUnique({
          where: { id: sessionId },
    select: { visitRecordId: true, providerId: true },
        });
        await prisma.aIScribeSession.update({
          where: { id: sessionId },
          data: {
            status: 'FAILED',
            errorMessage,
          },
        });
        logStructured('Processing Failed', {
          sessionId,
          visitRecordId: session?.visitRecordId,
          providerId: session?.providerId,
          error: errorMessage,
        });
        throw err;
      }
    },
    {
      connection: redisConfig,
      concurrency: 2,
    }
  );

  worker.on('completed', (job) => {
    logStructured('Job Completed', {
      jobId: job.id,
      sessionId: job.data.sessionId,
    });
  });

  worker.on('failed', (job, err) => {
    logStructured('Job Failed', {
      jobId: job?.id,
      sessionId: job?.data.sessionId,
      error: err instanceof Error ? err.message : String(err),
    });
  });

  return worker;
}
