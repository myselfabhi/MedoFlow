import prisma from '../config/prisma';
import { ApiError } from '../types/errors';

const HOLD_DURATION_MINUTES = 3;

export interface CreateSlotHoldInput {
  clinicId: string;
  providerId: string;
  serviceId: string;
  locationId?: string | null;
  startTime: Date;
  endTime: Date;
  patientId?: string;
}

/**
 * Optional slot locking: Create a temporary hold for 2-3 minutes when patient selects a slot.
 * Release hold automatically if booking not completed.
 */
export const createSlotHold = async (input: CreateSlotHoldInput) => {
  const expiresAt = new Date(
    Date.now() + HOLD_DURATION_MINUTES * 60 * 1000
  );

  const hold = await prisma.slotHold.create({
    data: {
      clinicId: input.clinicId,
      providerId: input.providerId,
      serviceId: input.serviceId,
      locationId: input.locationId ?? null,
      startTime: input.startTime,
      endTime: input.endTime,
      patientId: input.patientId ?? null,
      expiresAt,
    },
  });

  return { ...hold, expiresAt };
};

export const releaseSlotHold = async (holdId: string, clinicId: string) => {
  const deleted = await prisma.slotHold.deleteMany({
    where: { id: holdId, clinicId },
  });
  return deleted.count > 0;
};

export const validateAndConsumeSlotHold = async (
  holdId: string,
  clinicId: string,
  providerId: string,
  serviceId: string,
  locationId: string | null | undefined,
  startTime: Date,
  endTime: Date
) => {
  const hold = await prisma.slotHold.findFirst({
    where: { id: holdId, clinicId },
  });
  if (!hold) return false;
  if (hold.expiresAt < new Date()) return false;
  if (
    hold.providerId !== providerId ||
    hold.serviceId !== serviceId ||
    (hold.locationId ?? null) !== (locationId ?? null)
  )
    return false;
  if (
    hold.startTime.getTime() !== startTime.getTime() ||
    hold.endTime.getTime() !== endTime.getTime()
  )
    return false;

  await prisma.slotHold.delete({ where: { id: holdId } });
  return true;
};

/**
 * Expire old slot holds. Call from cron or periodically.
 */
export const expireSlotHolds = async (): Promise<number> => {
  const result = await prisma.slotHold.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
};
