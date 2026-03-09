/**
 * AI Scribe service - session management, audio upload, transcript processing,
 * SOAP draft generation, and approval flow.
 * Structured for future extensions: live transcription, multiple recordings, real-time AI.
 */

import prisma from '../config/prisma';
import { ApiError } from '../types/errors';
import { AIScribeStatus } from '@prisma/client';
import * as visitService from './visitService';
import * as storageService from './storageService';
import * as auditService from './auditService';
import * as openaiService from './openaiService';

export interface SoapDraft {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface PatientSummary {
  diagnosis?: string;
  treatmentPlan?: string;
  nextSteps?: string;
}

export const createSession = async (
  visitRecordId: string,
  providerId: string,
  clinicId: string
) => {
  const visitRecord = await visitService.getVisitRecordById(visitRecordId, {
    clinicId,
  });
  if (!visitRecord) {
    const err = new Error('Visit record not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  if (visitRecord.providerId !== providerId) {
    const err = new Error('Access denied') as ApiError;
    err.statusCode = 403;
    throw err;
  }
  if ((visitRecord as { isFinalized?: boolean }).isFinalized) {
    const err = new Error('Visit record is finalized') as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const session = await prisma.aIScribeSession.create({
    data: {
      visitRecordId,
      providerId,
      clinicId,
      status: AIScribeStatus.RECORDING,
    },
    include: {
      visitRecord: { select: { id: true, appointmentId: true } },
    },
  });
  return session;
};

export const uploadAudio = async (
  sessionId: string,
  providerId: string,
  clinicId: string,
  buffer: Buffer,
  mimeType: string,
  originalName?: string
) => {
  const session = await getSessionById(sessionId, providerId, clinicId);
  if (!session) {
    const err = new Error('Session not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  if (session.status !== AIScribeStatus.RECORDING && session.status !== AIScribeStatus.FAILED) {
    const err = new Error('Session is not in recording state') as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const audioUrl = await storageService.uploadAudio({
    sessionId,
    buffer,
    mimeType,
    originalName,
  });

  const updated = await prisma.aIScribeSession.update({
    where: { id: sessionId },
    data: {
      audioUrl,
      status: AIScribeStatus.TRANSCRIBING,
      errorMessage: null,
    },
    include: {
      visitRecord: { select: { id: true, appointmentId: true } },
    },
  });
  return updated;
};

export const getSessionById = async (
  sessionId: string,
  providerId: string,
  clinicId: string
) => {
  return prisma.aIScribeSession.findFirst({
    where: {
      id: sessionId,
      providerId,
      clinicId,
    },
    include: {
      visitRecord: {
        select: {
          id: true,
          appointmentId: true,
          patientId: true,
          isFinalized: true,
          currentVersion: true,
        },
      },
      provider: { select: { userId: true } },
    },
  });
};

export const getSessionForProvider = async (
  sessionId: string,
  providerId: string,
  clinicId: string
) => {
  const session = await getSessionById(sessionId, providerId, clinicId);
  if (!session) return null;
  return session;
};

export const updateTranscript = async (
  sessionId: string,
  transcript: string
) => {
  return prisma.aIScribeSession.update({
    where: { id: sessionId },
    data: { transcript },
  });
};

export const updateAiDraft = async (
  sessionId: string,
  aiDraft: SoapDraft
) => {
  return prisma.aIScribeSession.update({
    where: { id: sessionId },
    data: {
      aiDraft: aiDraft as object,
      status: AIScribeStatus.DRAFT_GENERATED,
    },
  });
};

export const getVisitRecordForSession = async (sessionId: string) => {
  const session = await prisma.aIScribeSession.findUnique({
    where: { id: sessionId },
    include: {
      visitRecord: true,
    },
  });
  return session?.visitRecord ?? null;
};

export const saveDraftAsVisitNoteVersion = async (
  sessionId: string,
  draft: SoapDraft
) => {
  const session = await prisma.aIScribeSession.findUnique({
    where: { id: sessionId },
    include: { visitRecord: true, provider: { select: { userId: true } } },
  });
  if (!session) {
    const err = new Error('Session not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  const userId = session.provider.userId;
  if (!userId) {
    const err = new Error('Provider has no user account') as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const version = await prisma.visitNoteVersion.create({
    data: {
      visitRecordId: session.visitRecordId,
      subjective: draft.subjective,
      objective: draft.objective,
      assessment: draft.assessment,
      plan: draft.plan,
      createdById: userId,
    },
  });

  await prisma.visitRecord.update({
    where: { id: session.visitRecordId },
    data: {
      currentVersionId: version.id,
      subjective: draft.subjective,
      objective: draft.objective,
      assessment: draft.assessment,
      plan: draft.plan,
    },
  });

  await prisma.aIScribeSession.update({
    where: { id: sessionId },
    data: { status: AIScribeStatus.DRAFT_GENERATED },
  });

  return version;
};

export const updateDraft = async (
  sessionId: string,
  providerId: string,
  clinicId: string,
  draft: Partial<SoapDraft>
) => {
  const session = await getSessionById(sessionId, providerId, clinicId);
  if (!session) {
    const err = new Error('Session not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  if (
    session.status !== AIScribeStatus.DRAFT_GENERATED &&
    session.status !== AIScribeStatus.EDITED
  ) {
    const err = new Error('Draft not available for editing') as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const currentDraft = (session.aiDraft as unknown as SoapDraft) || {};
  const merged: SoapDraft = {
    subjective: draft.subjective ?? currentDraft.subjective ?? '',
    objective: draft.objective ?? currentDraft.objective ?? '',
    assessment: draft.assessment ?? currentDraft.assessment ?? '',
    plan: draft.plan ?? currentDraft.plan ?? '',
  };

  return prisma.aIScribeSession.update({
    where: { id: sessionId },
    data: {
      aiDraft: merged as object,
      status: AIScribeStatus.EDITED,
    },
  });
};

export const approveDraft = async (
  sessionId: string,
  providerId: string,
  clinicId: string,
  performedById: string
) => {
  const session = await getSessionById(sessionId, providerId, clinicId);
  if (!session) {
    const err = new Error('Session not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  if (
    session.status !== AIScribeStatus.DRAFT_GENERATED &&
    session.status !== AIScribeStatus.EDITED
  ) {
    const err = new Error('Draft must be ready before approval') as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const draft = session.aiDraft as unknown as SoapDraft;
  if (!draft?.subjective && !draft?.objective && !draft?.assessment && !draft?.plan) {
    const err = new Error('No draft content to approve') as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const provider = await visitService.getProviderByUserId(performedById);
  if (!provider || session.providerId !== provider.id) {
    const err = new Error('Provider not found or access denied') as ApiError;
    err.statusCode = 403;
    throw err;
  }

  const patientSummary = await openaiService.generatePatientSummary(draft);

  await prisma.$transaction(async (tx) => {
    const version = await tx.visitNoteVersion.create({
      data: {
        visitRecordId: session.visitRecordId,
        subjective: draft.subjective,
        objective: draft.objective,
        assessment: draft.assessment,
        plan: draft.plan,
        createdById: performedById,
      },
    });

    await tx.visitRecord.update({
      where: { id: session.visitRecordId },
      data: {
        currentVersionId: version.id,
        subjective: draft.subjective,
        objective: draft.objective,
        assessment: draft.assessment,
        plan: draft.plan,
        status: 'FINAL',
        isFinalized: true,
      },
    });

    await tx.aIScribeSession.update({
      where: { id: sessionId },
      data: {
        status: AIScribeStatus.APPROVED,
        patientSummary: patientSummary as object,
      },
    });
  });

  const updated = await prisma.aIScribeSession.findUnique({
    where: { id: sessionId },
    include: {
      visitRecord: {
        select: {
          id: true,
          isFinalized: true,
          currentVersion: true,
        },
      },
    },
  });

  await auditService.logAudit({
    clinicId,
    entityType: 'VisitRecord',
    entityId: session.visitRecordId,
    action: 'VISIT_FINALIZED',
    fieldChanged: 'isFinalized',
    oldValue: false,
    newValue: true,
    performedById,
  });

  return updated;
};

export const setPatientSummary = async (
  sessionId: string,
  patientSummary: PatientSummary
) => {
  return prisma.aIScribeSession.update({
    where: { id: sessionId },
    data: { patientSummary: patientSummary as object },
  });
};

export const getApprovedPatientSummary = async (
  visitRecordId: string,
  patientId: string
) => {
  const session = await prisma.aIScribeSession.findFirst({
    where: {
      visitRecordId,
      status: AIScribeStatus.APPROVED,
      visitRecord: { patientId },
    },
    orderBy: { updatedAt: 'desc' },
  });
  return session?.patientSummary as PatientSummary | null;
};

export const getSessionByVisitRecordId = async (
  visitRecordId: string,
  providerId: string,
  clinicId: string
) => {
  return prisma.aIScribeSession.findFirst({
    where: {
      visitRecordId,
      providerId,
      clinicId,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      visitRecord: {
        select: {
          id: true,
          appointmentId: true,
          patientId: true,
          isFinalized: true,
          currentVersion: true,
        },
      },
    },
  });
};
