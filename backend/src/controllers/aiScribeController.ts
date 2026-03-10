import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import * as aiScribeService from '../services/aiScribeService';
import * as visitService from '../services/visitService';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../types/errors';
import { aiScribeQueue } from '../queues/aiScribeQueue';

const providerScope = async (req: Request): Promise<{ providerId: string; clinicId: string }> => {
  const provider = await visitService.getProviderByUserId(req.user!.id);
  if (!provider) {
    const err = new Error('Provider profile not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  const clinicId = req.user!.clinicId!;
  if (!clinicId) {
    const err = new Error('Clinic ID is required') as ApiError;
    err.statusCode = 400;
    throw err;
  }
  return { providerId: provider.id, clinicId };
};

export const startSession = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { providerId, clinicId } = await providerScope(req);
    const { visitRecordId } = req.body as { visitRecordId: string };
    if (!visitRecordId) {
      const err = new Error('visitRecordId is required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const session = await aiScribeService.createSession(
      visitRecordId,
      providerId,
      clinicId
    );
    successResponse(res, 201, 'AI Scribe session started', { session });
  }
);

export const uploadAudio = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const sessionId = req.params.id as string;
    const { providerId, clinicId } = await providerScope(req);

    const sessionCheck = await aiScribeService.getSessionById(
      sessionId,
      providerId,
      clinicId
    );
    if (!sessionCheck) {
      const err = new Error('Session not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    if (sessionCheck.status === 'APPROVED') {
      const err = new Error('This session has already been finalized.') as ApiError;
      err.statusCode = 400;
      throw err;
    }

    const file = req.file;
    if (!file || !file.buffer) {
      const err = new Error('No audio file uploaded') as ApiError;
      err.statusCode = 400;
      throw err;
    }

    const session = await aiScribeService.uploadAudio(
      sessionId,
      providerId,
      clinicId,
      file.buffer,
      file.mimetype,
      file.originalname
    );

    try {
      await aiScribeQueue.add('process', { sessionId });
    } catch (err) {
      console.error('[AI Scribe] Failed to queue job:', err);
    }

    successResponse(res, 200, 'Audio uploaded, processing started', { session });
  }
);

export const process = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const sessionId = req.params.id as string;
    const { providerId, clinicId } = await providerScope(req);

    const session = await aiScribeService.getSessionById(
      sessionId,
      providerId,
      clinicId
    );
    if (!session) {
      const err = new Error('Session not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    if (!session.audioUrl) {
      const err = new Error('No audio to process') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    if (session.status === 'APPROVED') {
      const err = new Error('This session has already been finalized.') as ApiError;
      err.statusCode = 400;
      throw err;
    }

    if (session.status === 'FAILED') {
      await prisma.aIScribeSession.update({
        where: { id: sessionId },
        data: { status: 'TRANSCRIBING', errorMessage: null },
      });
    }

    try {
      await aiScribeQueue.add('process', { sessionId });
    } catch (err) {
      console.error('[AI Scribe] Failed to queue job:', err);
    }

    const updated = session.status === 'FAILED'
      ? await aiScribeService.getSessionForProvider(sessionId, providerId, clinicId)
      : session;
    successResponse(res, 200, 'Processing started', { session: updated });
  }
);

export const getSessionStatus = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const sessionId = req.params.id as string;
    const { providerId, clinicId } = await providerScope(req);

    const session = await aiScribeService.getSessionById(
      sessionId,
      providerId,
      clinicId
    );
    if (!session) {
      const err = new Error('Session not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    successResponse(res, 200, 'Status retrieved', {
      status: session.status,
      processingStartedAt: session.processingStartedAt,
      processingCompletedAt: session.processingCompletedAt,
      errorMessage: session.errorMessage,
    });
  }
);

export const getSession = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const sessionId = req.params.id as string;
    const { providerId, clinicId } = await providerScope(req);

    const session = await aiScribeService.getSessionForProvider(
      sessionId,
      providerId,
      clinicId
    );
    if (!session) {
      const err = new Error('Session not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    successResponse(res, 200, 'Session retrieved', { session });
  }
);

export const updateDraft = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const sessionId = req.params.id as string;
    const { providerId, clinicId } = await providerScope(req);
    const { subjective, objective, assessment, plan } = req.body as Partial<
      aiScribeService.SoapDraft
    >;

    const session = await aiScribeService.updateDraft(
      sessionId,
      providerId,
      clinicId,
      { subjective, objective, assessment, plan }
    );
    successResponse(res, 200, 'Draft updated', { session });
  }
);

export const regenerateDraft = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const sessionId = req.params.id as string;
    const { providerId, clinicId } = await providerScope(req);

    const session = await aiScribeService.getSessionById(
      sessionId,
      providerId,
      clinicId
    );
    if (!session) {
      const err = new Error('Session not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    if (!session.transcript) {
      const err = new Error('No transcript to regenerate from') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    if (session.status === 'APPROVED') {
      const err = new Error('This session has already been finalized.') as ApiError;
      err.statusCode = 400;
      throw err;
    }

    await prisma.aIScribeSession.update({
      where: { id: sessionId },
      data: { status: 'TRANSCRIBING' },
    });

    try {
      await aiScribeQueue.add('process', { sessionId });
    } catch (err) {
      console.error('[AI Scribe] Failed to queue job:', err);
    }

    const updated = await aiScribeService.getSessionForProvider(
      sessionId,
      providerId,
      clinicId
    );
    successResponse(res, 200, 'Regeneration started', { session: updated });
  }
);

export const approve = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const sessionId = req.params.id as string;
    const { providerId, clinicId } = await providerScope(req);

    const session = await aiScribeService.approveDraft(
      sessionId,
      providerId,
      clinicId,
      req.user!.id
    );
    successResponse(res, 200, 'Note approved and finalized', { session });
  }
);

export const getByVisitRecord = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const visitRecordId = req.params.visitRecordId as string;
    const { providerId, clinicId } = await providerScope(req);

    const session = await aiScribeService.getSessionByVisitRecordId(
      visitRecordId,
      providerId,
      clinicId
    );
    successResponse(res, 200, 'Session retrieved', { session });
  }
);
