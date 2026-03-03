import prisma from '../config/prisma';
import { ApiError } from '../types/errors';
import * as auditService from './auditService';

const CANCELLED_STATUS = 'CANCELLED';

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h ?? 0, minutes: m ?? 0 };
}

function timeToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function timeStringToMinutes(timeStr: string): number {
  const { hours, minutes } = parseTime(timeStr);
  return hours * 60 + minutes;
}

function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

export interface GetAvailableSlotsParams {
  providerId: string;
  serviceDurationMinutes: number;
  date: string;
  clinicId?: string;
}

export const getAvailableSlots = async (
  params: GetAvailableSlotsParams
): Promise<string[]> => {
  const { providerId, serviceDurationMinutes, date, clinicId } = params;

  const provider = await prisma.provider.findFirst({
    where: { id: providerId, isActive: true, ...(clinicId && { clinicId }) },
    include: { providerAvailability: true },
  });

  if (!provider) return [];
  if (!provider.isActive) return [];

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const weekday = targetDate.getDay();

  const schedule = provider.providerAvailability.find(
    (a) => a.weekday === weekday
  );
  if (!schedule) return [];

  const bufferMinutes = provider.bufferMinutes ?? 0;

  const dayStart = new Date(targetDate);
  const dayEnd = new Date(targetDate);
  const { hours: startH, minutes: startM } = parseTime(schedule.startTime);
  const { hours: endH, minutes: endM } = parseTime(schedule.endTime);
  dayStart.setHours(startH, startM, 0, 0);
  dayEnd.setHours(endH, endM, 0, 0);

  const appointments = await prisma.appointment.findMany({
    where: {
      providerId,
      status: { not: CANCELLED_STATUS },
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
    select: { startTime: true, endTime: true },
  });

  const unavailabilities = await prisma.providerUnavailability.findMany({
    where: {
      providerId,
      date: {
        gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
        lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1),
      },
    },
  });

  const blockedRanges: { start: Date; end: Date }[] = [];

  for (const apt of appointments) {
    const start = new Date(apt.startTime);
    const end = addMinutes(new Date(apt.endTime), bufferMinutes);
    blockedRanges.push({ start, end });
  }

  for (const unav of unavailabilities) {
    const baseDate = new Date(unav.date);
    baseDate.setHours(0, 0, 0, 0);
    const unavStart = unav.startTime
      ? (() => {
          const d = new Date(baseDate);
          const [h, m] = unav.startTime.split(':').map(Number);
          d.setHours(h ?? 0, m ?? 0, 0, 0);
          return d;
        })()
      : new Date(baseDate);
    const unavEnd = unav.endTime
      ? (() => {
          const d = new Date(baseDate);
          const [h, m] = unav.endTime.split(':').map(Number);
          d.setHours(h ?? 0, m ?? 0, 0, 0);
          return d;
        })()
      : new Date(baseDate);
    unavEnd.setHours(23, 59, 59, 999);
    blockedRanges.push({ start: unavStart, end: unavEnd });
  }

  const slots: string[] = [];
  let slotStart = new Date(dayStart);

  while (slotStart < dayEnd) {
    const slotEnd = addMinutes(slotStart, serviceDurationMinutes);
    if (slotEnd > dayEnd) break;

    const overlaps = blockedRanges.some(
      (b) => slotStart < b.end && slotEnd > b.start
    );
    if (!overlaps) {
      slots.push(slotStart.toISOString());
    }

    slotStart = addMinutes(slotStart, 15);
  }

  return slots;
};

export interface PreviewAvailabilityUpdateParams {
  providerId: string;
  weekday: number;
  newStartTime: string;
  newEndTime: string;
}

export const previewAvailabilityUpdate = async (
  params: PreviewAvailabilityUpdateParams
): Promise<{ affectedCount: number; affectedAppointmentIds: string[] }> => {
  const { providerId, weekday, newStartTime, newEndTime } = params;
  const now = new Date();

  const appointments = await prisma.appointment.findMany({
    where: {
      providerId,
      status: { not: CANCELLED_STATUS },
      startTime: { gte: now },
    },
    select: { id: true, startTime: true, endTime: true },
  });

  const newStartMinutes = timeStringToMinutes(newStartTime);
  const newEndMinutes = timeStringToMinutes(newEndTime);
  const affectedAppointmentIds: string[] = [];

  for (const apt of appointments) {
    const aptStart = new Date(apt.startTime);
    const aptEnd = new Date(apt.endTime);
    if (aptStart.getDay() !== weekday) continue;

    const aptStartMinutes = timeToMinutes(aptStart);
    const aptEndMinutes = timeToMinutes(aptEnd);

    const fallsOutside =
      aptStartMinutes < newStartMinutes || aptEndMinutes > newEndMinutes;
    if (fallsOutside) {
      affectedAppointmentIds.push(apt.id);
    }
  }

  return {
    affectedCount: affectedAppointmentIds.length,
    affectedAppointmentIds,
  };
};

export interface CreateAvailabilityData {
  providerId: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export const createAvailability = async (
  data: CreateAvailabilityData,
  clinicId: string,
  performedById: string
) => {
  const provider = await prisma.provider.findFirst({
    where: { id: data.providerId, clinicId },
  });
  if (!provider) {
    const err = new Error('Provider not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  const created = await prisma.providerAvailability.create({
    data: {
      providerId: data.providerId,
      weekday: data.weekday,
      startTime: data.startTime,
      endTime: data.endTime,
    },
  });
  await auditService.logAudit({
    clinicId,
    entityType: 'ProviderAvailability',
    entityId: created.id,
    action: 'CREATE',
    performedById,
  });
  return created;
};

export interface UpdateAvailabilityOptions {
  force?: boolean;
}

export const updateAvailability = async (
  id: string,
  data: Partial<Pick<CreateAvailabilityData, 'weekday' | 'startTime' | 'endTime'>>,
  clinicId: string,
  performedById: string,
  options?: UpdateAvailabilityOptions
) => {
  const existing = await prisma.providerAvailability.findFirst({
    where: { id },
    include: { provider: true },
  });
  if (!existing || existing.provider.clinicId !== clinicId) {
    const err = new Error('Availability not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  const newWeekday = data.weekday ?? existing.weekday;
  const newStartTime = data.startTime ?? existing.startTime;
  const newEndTime = data.endTime ?? existing.endTime;

  const preview = await previewAvailabilityUpdate({
    providerId: existing.providerId,
    weekday: newWeekday,
    newStartTime,
    newEndTime,
  });

  if (preview.affectedCount > 0 && !options?.force) {
    return {
      requiresConfirmation: true as const,
      affectedCount: preview.affectedCount,
      affectedAppointmentIds: preview.affectedAppointmentIds,
    };
  }

  const updated = await prisma.providerAvailability.update({
    where: { id },
    data: {
      ...(data.weekday !== undefined && { weekday: data.weekday }),
      ...(data.startTime !== undefined && { startTime: data.startTime }),
      ...(data.endTime !== undefined && { endTime: data.endTime }),
    },
  });
  const changes: string[] = [];
  if (data.weekday !== undefined && data.weekday !== existing.weekday)
    changes.push('weekday');
  if (data.startTime !== undefined && data.startTime !== existing.startTime)
    changes.push('startTime');
  if (data.endTime !== undefined && data.endTime !== existing.endTime)
    changes.push('endTime');
  for (const field of changes) {
    const oldVal = (existing as Record<string, unknown>)[field];
    const newVal = (updated as Record<string, unknown>)[field];
    if (oldVal !== newVal) {
      await auditService.logAudit({
        clinicId,
        entityType: 'ProviderAvailability',
        entityId: id,
        action: 'UPDATE',
        fieldChanged: field,
        oldValue: oldVal,
        newValue: newVal,
        performedById,
      });
    }
  }

  if (preview.affectedCount > 0 && options?.force) {
    await auditService.logAudit({
      clinicId,
      entityType: 'ProviderAvailability',
      entityId: id,
      action: 'AVAILABILITY_UPDATED_WITH_IMPACT',
      newValue: { affectedCount: preview.affectedCount, affectedAppointmentIds: preview.affectedAppointmentIds },
      performedById,
    });
  }

  return updated;
};

export interface CreateUnavailabilityData {
  providerId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export const createUnavailability = async (
  data: CreateUnavailabilityData,
  clinicId: string,
  performedById: string
) => {
  const provider = await prisma.provider.findFirst({
    where: { id: data.providerId, clinicId },
  });
  if (!provider) {
    const err = new Error('Provider not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }
  const created = await prisma.providerUnavailability.create({
    data: {
      providerId: data.providerId,
      date: new Date(data.date),
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
      reason: data.reason ?? null,
    },
  });
  await auditService.logAudit({
    clinicId,
    entityType: 'ProviderUnavailability',
    entityId: created.id,
    action: 'CREATE',
    performedById,
  });
  return created;
};
