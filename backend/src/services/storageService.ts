/**
 * S3-compatible storage for AI Scribe audio files.
 * Uses AWS SDK - works with S3, MinIO, DigitalOcean Spaces, etc.
 * Falls back to local filesystem when S3 is not configured.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../types/errors';

const BUCKET = process.env.S3_BUCKET || 'medoflow-ai-scribe';
const REGION = process.env.S3_REGION || 'us-east-1';
const ENDPOINT = process.env.S3_ENDPOINT; // e.g. https://s3.amazonaws.com or MinIO endpoint
const USE_S3 = !!(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
const UPLOAD_BASE = path.resolve(process.cwd(), 'uploads', 'ai-scribe');

let s3Client: S3Client | null = null;

if (USE_S3) {
  s3Client = new S3Client({
    region: REGION,
    ...(ENDPOINT && {
      endpoint: ENDPOINT,
      forcePathStyle: true,
    }),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

function getStorageKey(sessionId: string, filename: string): string {
  return `sessions/${sessionId}/${Date.now()}-${filename}`;
}

function ensureLocalDir(sessionId: string): string {
  const dir = path.join(UPLOAD_BASE, sessionId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function uploadAudio(params: {
  sessionId: string;
  buffer: Buffer;
  mimeType: string;
  originalName?: string;
}): Promise<string> {
  const { sessionId, buffer, mimeType, originalName } = params;
  const ext = path.extname(originalName || 'audio.webm') || '.webm';
  const filename = `audio${ext}`;
  const key = getStorageKey(sessionId, filename);

  if (s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    const baseUrl = process.env.S3_PUBLIC_URL || ENDPOINT;
    if (baseUrl) {
      return `${baseUrl}/${BUCKET}/${key}`;
    }
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: 86400 * 7 }
    );
    return signedUrl;
  }

  const dir = ensureLocalDir(sessionId);
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, buffer);
  return path.join('uploads', 'ai-scribe', sessionId, filename).replace(/\\/g, '/');
}

export async function getAudioUrl(storagePath: string): Promise<string> {
  if (storagePath.startsWith('http') || storagePath.startsWith('/uploads/')) {
    return storagePath;
  }
  if (s3Client) {
    const [bucket, ...keyParts] = storagePath.split('/');
    const key = keyParts.join('/');
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: bucket || BUCKET, Key: key }),
      { expiresIn: 3600 }
    );
    return signedUrl;
  }
  return storagePath;
}

export async function deleteAudio(storagePath: string): Promise<void> {
  if (storagePath.startsWith('/uploads/')) {
    const fullPath = path.join(process.cwd(), storagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    return;
  }
  if (s3Client && storagePath.includes('/')) {
    const parts = storagePath.replace(/^https?:\/\/[^/]+\//, '').split('/');
    const key = parts.slice(1).join('/');
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
    );
  }
}

export function isS3Configured(): boolean {
  return USE_S3;
}
