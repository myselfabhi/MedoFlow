/**
 * BullMQ queue for AI Scribe processing.
 * Queue name: ai-scribe-processing
 * Worker steps: transcribe (Whisper) -> generate SOAP (GPT) -> update session.
 * Visit note versions are only created during explicit provider approval.
 */

import { Queue, Worker, Job } from 'bullmq';
import OpenAI from 'openai';
import prisma from '../config/prisma';
import * as aiScribeService from '../services/aiScribeService';
import * as storageService from '../services/storageService';
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
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
  },
});

export interface AiScribeJobData {
  sessionId: string;
  /** When true, skip Whisper and regenerate SOAP from existing transcript only */
  regenerateSoapOnly?: boolean;
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

async function fetchAudioBuffer(audioRef: string): Promise<Buffer> {
  if (audioRef.startsWith('s3:') || audioRef.startsWith('local:')) {
    return storageService.getAudioBufferFromRef(audioRef);
  }
  if (audioRef.startsWith('/uploads/') || audioRef.startsWith('uploads/')) {
    const normalized = audioRef.startsWith('/') ? audioRef.slice(1) : audioRef;
    const fullPath = path.join(process.cwd(), normalized);
    return fs.readFileSync(fullPath);
  }
  if (audioRef.startsWith('http')) {
    return new Promise((resolve, reject) => {
      const client = audioRef.startsWith('https') ? https : http;
      client
        .get(audioRef, (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        })
        .on('error', reject);
    });
  }
  throw new Error('Invalid audio reference');
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

function cleanTranscript(transcript: string): string {
  const fillerPhrases = [
    /\bhello doctor\b/gi,
    /\bgood morning\b/gi,
    /\bgood afternoon\b/gi,
    /\bgood evening\b/gi,
    /\bthank you\b/gi,
    /\bthanks\b/gi,
    /\bokay\b/gi,
    /\bok\b/gi,
    /\buh\b/gi,
    /\bum\b/gi,
    /\buhm\b/gi,
  ];
  let cleaned = transcript;
  for (const pattern of fillerPhrases) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  return cleaned.replace(/\s+/g, ' ').trim();
}

export interface ClinicalTimeline {
  symptoms: string[];
  duration: string | null;
  assessment: string | null;
  plan: string[];
}

export interface ClinicalAnalysisResult {
  timeline: ClinicalTimeline;
  soap: aiScribeService.SoapDraft;
}

async function generateClinicalAnalysis(transcript: string): Promise<ClinicalAnalysisResult> {
  const cleaned = cleanTranscript(transcript);
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
        content: `Convert this medical conversation into a clinical timeline and a structured SOAP note.
Return valid JSON only, no markdown or extra text:
{
  "timeline": {
    "symptoms": ["symptom1", "symptom2"],
    "duration": "e.g. 3 days or null if unknown",
    "assessment": "brief clinical impression or null",
    "plan": ["plan item 1", "plan item 2"]
  },
  "soap": {
    "subjective": "",
    "objective": "",
    "assessment": "",
    "plan": ""
  }
}`,
      },
      {
        role: 'user',
        content: cleaned,
      },
    ],
    response_format: { type: 'json_object' },
  });
  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('No response from GPT');
  const parsed = JSON.parse(text) as {
    timeline?: { symptoms?: string[]; duration?: string | null; assessment?: string | null; plan?: string[] };
    soap?: aiScribeService.SoapDraft;
  };
  const timeline = parsed.timeline ?? {};
  const soap = (parsed.soap ?? {}) as Partial<aiScribeService.SoapDraft>;
  return {
    timeline: {
      symptoms: Array.isArray(timeline.symptoms) ? timeline.symptoms.map(String) : [],
      duration: timeline.duration != null ? String(timeline.duration) : null,
      assessment: timeline.assessment != null ? String(timeline.assessment) : null,
      plan: Array.isArray(timeline.plan) ? timeline.plan.map(String) : [],
    },
    soap: {
      subjective: String(soap.subjective ?? ''),
      objective: String(soap.objective ?? ''),
      assessment: String(soap.assessment ?? ''),
      plan: String(soap.plan ?? ''),
    },
  };
}

async function processAiScribeJob(job: Job<AiScribeJobData>) {
  const { sessionId, regenerateSoapOnly } = job.data;
  const startTime = Date.now();

  const session = await prisma.aIScribeSession.findUnique({
    where: { id: sessionId },
    include: { provider: { select: { userId: true } } },
  });
  if (!session) {
    throw new Error('Session not found');
  }
  if (!regenerateSoapOnly && !session.audioUrl) {
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

  let transcript: string;

  if (regenerateSoapOnly && session.transcript) {
    transcript = session.transcript;
    try {
      await prisma.aIScribeSession.update({
        where: { id: sessionId },
        data: { status: 'TRANSCRIBING' },
      });
    } catch {
      // non-fatal
    }
    await job.updateProgress(40);
  } else {
    try {
      await prisma.aIScribeSession.update({
        where: { id: sessionId },
        data: { status: 'TRANSCRIBING' },
      });
    } catch {
      // non-fatal
    }

    const buffer = await fetchAudioBuffer(session.audioUrl!);
    const mimeType = 'audio/webm';
    await job.updateProgress(30);

    transcript = await transcribeWithWhisper(buffer, mimeType);
    await prisma.aIScribeSession.update({
      where: { id: sessionId },
      data: { transcript },
    });
    await job.updateProgress(50);
  }

  const { timeline, soap: soapDraft } = await generateClinicalAnalysis(transcript);
  await prisma.aIScribeSession.update({
    where: { id: sessionId },
    data: {
      timeline: timeline as object,
      aiDraft: soapDraft as object,
      status: 'DRAFT_GENERATED',
      processingCompletedAt: new Date(),
      aiModel: OPENAI_MODEL,
      errorMessage: null,
    },
  });
  await job.updateProgress(80);

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
      const JOB_TIMEOUT_MS = 60000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI processing timeout')), JOB_TIMEOUT_MS);
      });
      try {
        await Promise.race([processAiScribeJob(job), timeoutPromise]);
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
