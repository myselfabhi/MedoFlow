import prisma from '../config/prisma';
import { ApiError } from '../types/errors';

export interface CreateVisitRecordData {
  appointmentId: string;
  patientId?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export const getProviderByUserId = async (userId: string) => {
  return prisma.provider.findFirst({
    where: { userId },
  });
};

const validateAppointmentForProvider = async (
  appointmentId: string,
  providerId: string,
  clinicId: string
) => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, providerId, clinicId },
  });
  if (!appointment) {
    const err = new Error(
      'Appointment not found or provider not assigned'
    ) as ApiError;
    err.statusCode = 404;
    throw err;
  }
  return appointment;
};

export const createVisitRecord = async (
  data: CreateVisitRecordData,
  providerId: string,
  clinicId: string
) => {
  const { appointmentId, patientId, subjective, objective, assessment, plan } =
    data;

  await validateAppointmentForProvider(appointmentId, providerId, clinicId);

  const existing = await prisma.visitRecord.findUnique({
    where: { appointmentId },
  });
  if (existing) {
    const err = new Error(
      'Visit record already exists for this appointment'
    ) as ApiError;
    err.statusCode = 409;
    throw err;
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    const err = new Error('Appointment not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  return prisma.visitRecord.create({
    data: {
      clinicId,
      appointmentId,
      providerId,
      patientId: patientId || appointment.patientId,
      subjective,
      objective,
      assessment,
      plan,
    },
    include: {
      appointment: { select: { id: true, startTime: true, status: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

export const getVisitRecordByAppointment = async (
  appointmentId: string,
  clinicId?: string | null
) => {
  const where: { appointmentId: string; clinicId?: string } = { appointmentId };
  if (clinicId) where.clinicId = clinicId;

  return prisma.visitRecord.findFirst({
    where,
    include: {
      appointment: { select: { id: true, startTime: true, status: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

export const getVisitRecordById = async (
  id: string,
  where: { clinicId?: string } | Record<string, never> = {}
) => {
  return prisma.visitRecord.findFirst({
    where: { id, ...where },
    include: {
      appointment: { select: { id: true, startTime: true, status: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

export const updateVisitRecord = async (
  id: string,
  data: Partial<CreateVisitRecordData>,
  providerId: string,
  clinicId: string
) => {
  const record = await getVisitRecordById(id, { clinicId });
  if (!record) {
    const err = new Error('Visit record not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  if (record.providerId !== providerId) {
    const err = new Error(
      'Only the provider who created the record can edit it'
    ) as ApiError;
    err.statusCode = 403;
    throw err;
  }
  return prisma.visitRecord.update({
    where: { id },
    data: {
      ...(data.subjective !== undefined && { subjective: data.subjective }),
      ...(data.objective !== undefined && { objective: data.objective }),
      ...(data.assessment !== undefined && { assessment: data.assessment }),
      ...(data.plan !== undefined && { plan: data.plan }),
    },
    include: {
      appointment: { select: { id: true, startTime: true, status: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

export const finalizeVisitRecord = async (
  id: string,
  providerId: string,
  clinicId: string
) => {
  const record = await getVisitRecordById(id, { clinicId });
  if (!record) {
    const err = new Error('Visit record not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  if (record.providerId !== providerId) {
    const err = new Error(
      'Only the provider who created the record can finalize it'
    ) as ApiError;
    err.statusCode = 403;
    throw err;
  }

  return prisma.visitRecord.update({
    where: { id },
    data: { status: 'FINAL' },
    include: {
      appointment: { select: { id: true, startTime: true, status: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

export const getVisitRecordsByClinic = async (clinicId: string) => {
  return prisma.visitRecord.findMany({
    where: { clinicId },
    orderBy: { createdAt: 'desc' },
    include: {
      appointment: { select: { id: true, startTime: true, status: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};
