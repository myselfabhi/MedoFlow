import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import * as consultationService from '../services/consultationService';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../types/errors';
import { Role } from '@prisma/client';

// ---------------------------------------------------------------------------
// Scope helpers
// ---------------------------------------------------------------------------

async function providerScope(req: Request): Promise<{ providerId: string; clinicId: string }> {
    const user = req.user;
    if (!user) {
        const err = new Error('Authentication required') as ApiError;
        err.statusCode = 401;
        throw err;
    }
    const clinicId = (req.body?.clinicId as string) || (req.query?.clinicId as string) || user.clinicId;
    if (!clinicId) {
        const err = new Error('Clinic context required') as ApiError;
        err.statusCode = 400;
        throw err;
    }
    const provider = await prisma.provider.findFirst({
        where: { userId: user.id, clinicId },
    });
    if (!provider) {
        const err = new Error('Provider not found for this clinic') as ApiError;
        err.statusCode = 403;
        throw err;
    }
    return { providerId: provider.id, clinicId };
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/** POST /appointments/:id/consultation/start */
export const startSession = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const { providerId, clinicId } = await providerScope(req);
        const appointmentId = req.params.id as string;
        if (!appointmentId) {
            const err = new Error('Appointment ID required') as ApiError;
            err.statusCode = 400;
            throw err;
        }
        const session = await consultationService.createOrGetSession(
            appointmentId,
            providerId,
            clinicId,
            req.user!.id
        );
        successResponse(res, 201, 'Consultation session ready', { session });
    }
);

/** GET /consultations/:id */
export const getSession = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const sessionId = req.params.id as string;
        const session = await consultationService.getSessionById(
            sessionId,
            req.user!.id,
            req.user!.role as Role
        );
        successResponse(res, 200, 'Session retrieved', { session });
    }
);

/** GET /consultations/join/:token */
export const joinByToken = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const token = req.params.token as string;
        const session = await consultationService.getSessionByToken(token);
        successResponse(res, 200, 'Session retrieved', { session });
    }
);

/** GET /consultations/join/:token/video-token — Get room info via join token (for patients) */
export const getVideoTokenByJoinToken = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const joinToken = req.params.token as string;

        const session = await prisma.consultationSession.findFirst({
            where: { joinToken },
        });
        if (!session) {
            const err = new Error('Invalid or expired consultation link') as ApiError;
            err.statusCode = 404;
            throw err;
        }
        if (!session.meetingRoomName || !session.meetingRoomUrl) {
            const err = new Error('No video room created yet') as ApiError;
            err.statusCode = 400;
            throw err;
        }

        successResponse(res, 200, 'Video room info', {
            roomUrl: session.meetingRoomUrl,
            roomName: session.meetingRoomName,
            token: '',
        });
    }
);

/** GET /consultations/appointment/:appointmentId */
export const getByAppointment = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const appointmentId = req.params.appointmentId as string;
        const session = await consultationService.getSessionForAppointment(
            appointmentId,
            req.user!.id,
            req.user!.role as Role
        );
        successResponse(res, 200, 'Session retrieved', { session });
    }
);

/** POST /consultations/:id/consent */
export const grantConsent = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const sessionId = req.params.id as string;
        const session = await consultationService.grantConsent(
            sessionId,
            req.user!.id,
            req.user!.id
        );
        successResponse(res, 200, 'Consent granted', { session });
    }
);

/** POST /consultations/:id/recording/start */
export const startRecording = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const { providerId } = await providerScope(req);
        const sessionId = req.params.id as string;
        const session = await consultationService.startRecording(
            sessionId,
            providerId,
            req.user!.id
        );
        successResponse(res, 200, 'Recording started', { session });
    }
);

/** POST /consultations/:id/recording/stop */
export const stopRecording = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const { providerId } = await providerScope(req);
        const sessionId = req.params.id as string;
        const session = await consultationService.stopRecording(
            sessionId,
            providerId,
            req.user!.id
        );
        successResponse(res, 200, 'Recording stopped', { session });
    }
);

/** POST /consultations/:id/recording/upload */
export const uploadRecording = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const { providerId, clinicId } = await providerScope(req);
        const sessionId = req.params.id as string;
        const file = (req as Express.Request & { file?: Express.Multer.File }).file;
        if (!file) {
            const err = new Error('Audio file required') as ApiError;
            err.statusCode = 400;
            throw err;
        }
        const session = await consultationService.uploadRecording(
            sessionId,
            providerId,
            clinicId,
            file.buffer,
            file.mimetype,
            file.originalname,
            req.user!.id
        );
        successResponse(res, 200, 'Recording uploaded', { session });
    }
);

/** POST /consultations/:id/transcribe */
export const startTranscription = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const { providerId, clinicId } = await providerScope(req);
        const sessionId = req.params.id as string;
        const result = await consultationService.startTranscription(
            sessionId,
            providerId,
            clinicId,
            req.user!.id
        );
        successResponse(res, 200, 'Transcription started', result);
    }
);

/** GET /consultations/:id/transcript */
export const getTranscript = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const sessionId = req.params.id as string;
        const transcript = await consultationService.getTranscript(
            sessionId,
            req.user!.id,
            req.user!.role as Role
        );
        successResponse(res, 200, 'Transcript retrieved', transcript);
    }
);

/** POST /consultations/:id/convert-to-template */
export const convertToTemplate = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const { providerId, clinicId } = await providerScope(req);
        const sessionId = req.params.id as string;
        const result = await consultationService.convertToTemplate(
            sessionId,
            providerId,
            clinicId
        );
        successResponse(res, 200, 'Template conversion info', result);
    }
);

// ---------------------------------------------------------------------------
// Jitsi Video Room (free, no payment required)
// ---------------------------------------------------------------------------

/** POST /consultations/:id/video-room — Create a Jitsi room for the consultation */
export const createVideoRoom = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        await providerScope(req);
        const sessionId = req.params.id as string;

        const session = await prisma.consultationSession.findUnique({
            where: { id: sessionId },
        });
        if (!session) {
            const err = new Error('Consultation session not found') as ApiError;
            err.statusCode = 404;
            throw err;
        }

        // Generate deterministic Jitsi room name — no API call needed
        const roomName = `MedoFlow-${sessionId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`;
        const roomUrl = `https://meet.jit.si/${roomName}`;

        // Save to session if not already set
        if (!session.meetingRoomName) {
            await prisma.consultationSession.update({
                where: { id: sessionId },
                data: { meetingRoomUrl: roomUrl, meetingRoomName: roomName },
            });
        }

        successResponse(res, 201, 'Video room ready', {
            roomUrl: session.meetingRoomUrl || roomUrl,
            roomName: session.meetingRoomName || roomName,
            token: '', // Jitsi needs no token
        });
    }
);

/** GET /consultations/:id/video-token — Get room info for authenticated users */
export const getVideoToken = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const sessionId = req.params.id as string;

        const session = await prisma.consultationSession.findUnique({
            where: { id: sessionId },
        });
        if (!session) {
            const err = new Error('Consultation session not found') as ApiError;
            err.statusCode = 404;
            throw err;
        }
        if (!session.meetingRoomName || !session.meetingRoomUrl) {
            const err = new Error('No video room created yet') as ApiError;
            err.statusCode = 400;
            throw err;
        }

        successResponse(res, 200, 'Video room info', {
            roomUrl: session.meetingRoomUrl,
            roomName: session.meetingRoomName,
            token: '',
        });
    }
);
