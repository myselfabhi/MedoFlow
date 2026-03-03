import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../types/errors';

export const UPLOAD_BASE = path.resolve(process.cwd(), 'uploads');

export const ensureUploadDir = (clinicId: string, patientId: string): string => {
  const dir = path.join(UPLOAD_BASE, clinicId, patientId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

export const patientFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/|^application\/pdf|^text\//;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('File type not allowed') as ApiError;
      err.statusCode = 400;
      cb(err);
    }
  },
});

export const generateStoragePath = (
  clinicId: string,
  patientId: string,
  originalName: string
): { dir: string; filename: string; relativePath: string } => {
  const dir = ensureUploadDir(clinicId, patientId);
  const ext = path.extname(originalName) || '';
  const base = path.basename(originalName, ext);
  const safe = base.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
  const filename = `${safe}-${Date.now()}${ext}`;
  const relativePath = path.join(clinicId, patientId, filename);
  return { dir, filename, relativePath };
};
