import { DateTime, Interval } from 'luxon';
import {
  AppointmentStatus,
  ApprovalStatus,
  PaymentRequirementType,
  PaymentStatus,
} from '@prisma/client';

export interface SchedulingSlot {
  providerId: string;
  locationId: string | null;
  serviceId: string;
  timezone: string;
  start: string;
  end: string;
}

export interface BlockedInterval {
  start: Date;
  end: Date;
}

export const MIN_APPOINTMENT_DURATION_MINUTES = 30;
export const DEFAULT_SLOT_STEP_MINUTES = 30;

export interface AppointmentLifecycleState {
  status: AppointmentStatus;
  approvalStatus: ApprovalStatus;
  paymentStatus: PaymentStatus;
}

export function buildSlotFingerprint(slot: {
  providerId: string;
  locationId: string | null;
  start: string | Date;
  end: string | Date;
}): string {
  const start = typeof slot.start === 'string' ? slot.start : slot.start.toISOString();
  const end = typeof slot.end === 'string' ? slot.end : slot.end.toISOString();
  return [slot.providerId, slot.locationId ?? 'none', start, end].join('|');
}

export function getDateWindow(date: string, timezone: string) {
  const day = DateTime.fromISO(date, { zone: timezone });
  const start = day.startOf('day');
  const end = day.endOf('day');
  return {
    start,
    end,
    weekday: start.weekday % 7,
  };
}

export function toUtcFromLocal(date: string, time: string, timezone: string) {
  return DateTime.fromISO(`${date}T${time}`, { zone: timezone }).toUTC();
}

export function rangeOverlaps(
  first: { start: Date; end: Date },
  second: { start: Date; end: Date }
) {
  return first.start < second.end && first.end > second.start;
}

export function isBlockedByIntervals(
  slot: { start: Date; end: Date },
  blocked: BlockedInterval[]
) {
  return blocked.some((interval) => rangeOverlaps(slot, interval));
}

export function buildCandidateSlots(params: {
  date: string;
  timezone: string;
  locationId: string | null;
  providerId: string;
  serviceId: string;
  durationMinutes: number;
  schedules: Array<{ startTime: string; endTime: string }>;
  blocked: BlockedInterval[];
  stepMinutes?: number;
}): SchedulingSlot[] {
  const {
    date,
    timezone,
    locationId,
    providerId,
    serviceId,
    durationMinutes,
    schedules,
    blocked,
    stepMinutes = DEFAULT_SLOT_STEP_MINUTES,
  } = params;

  const slots: SchedulingSlot[] = [];

  for (const schedule of schedules) {
    let cursor = toUtcFromLocal(date, schedule.startTime, timezone);
    const scheduleEnd = toUtcFromLocal(date, schedule.endTime, timezone);

    while (cursor < scheduleEnd) {
      const slotEnd = cursor.plus({ minutes: durationMinutes });
      if (slotEnd > scheduleEnd) break;

      const slotRange = {
        start: cursor.toJSDate(),
        end: slotEnd.toJSDate(),
      };

      if (!isBlockedByIntervals(slotRange, blocked)) {
        slots.push({
          providerId,
          locationId,
          serviceId,
          timezone,
          start: cursor.toUTC().toISO()!,
          end: slotEnd.toUTC().toISO()!,
        });
      }

      cursor = cursor.plus({ minutes: stepMinutes });
    }
  }

  return slots;
}

export function isSlotWithinSchedules(params: {
  date: string;
  timezone: string;
  start: Date;
  end: Date;
  schedules: Array<{ startTime: string; endTime: string }>;
}) {
  const slotInterval = Interval.fromDateTimes(
    DateTime.fromJSDate(params.start, { zone: 'utc' }),
    DateTime.fromJSDate(params.end, { zone: 'utc' })
  );

  return params.schedules.some((schedule) => {
    const scheduleStart = toUtcFromLocal(params.date, schedule.startTime, params.timezone);
    const scheduleEnd = toUtcFromLocal(params.date, schedule.endTime, params.timezone);
    const scheduleInterval = Interval.fromDateTimes(scheduleStart, scheduleEnd);
    return scheduleInterval.engulfs(slotInterval);
  });
}

export function deriveAppointmentLifecycle(params: {
  requiresProviderApproval: boolean;
  requiresPrepayment: boolean;
  prepaymentType: string | null | undefined;
  priceAtBooking: PrismaDecimalLike;
  depositAmount?: PrismaDecimalLike | null;
}) {
  const paymentRequirementType =
    params.requiresPrepayment && params.prepaymentType === 'DEPOSIT'
      ? PaymentRequirementType.DEPOSIT
      : params.requiresPrepayment
        ? PaymentRequirementType.FULL
        : PaymentRequirementType.NONE;

  const approvalStatus = params.requiresProviderApproval
    ? ApprovalStatus.PENDING
    : ApprovalStatus.NOT_REQUIRED;

  const appointmentStatus = params.requiresProviderApproval
    ? AppointmentStatus.PENDING_PROVIDER_APPROVAL
    : params.requiresPrepayment
      ? AppointmentStatus.PENDING_PAYMENT
      : AppointmentStatus.CONFIRMED;

  const paymentStatus =
    paymentRequirementType === PaymentRequirementType.NONE
      ? PaymentStatus.NONE
      : PaymentStatus.PENDING;

  const depositAmount =
    paymentRequirementType === PaymentRequirementType.DEPOSIT
      ? params.depositAmount ?? null
      : paymentRequirementType === PaymentRequirementType.FULL
        ? params.priceAtBooking
        : null;

  return {
    appointmentStatus,
    approvalStatus,
    paymentRequirementType,
    paymentStatus,
    depositAmount,
  };
}

type PrismaDecimalLike = {
  toString(): string;
} | null;

export function resolveAppointmentLifecycle(params: {
  requiresProviderApproval: boolean;
  paymentRequirementType: PaymentRequirementType;
}): AppointmentLifecycleState {
  const requiresPayment = params.paymentRequirementType !== PaymentRequirementType.NONE;

  if (params.requiresProviderApproval) {
    return {
      status: AppointmentStatus.PENDING_PROVIDER_APPROVAL,
      approvalStatus: ApprovalStatus.PENDING,
      paymentStatus: requiresPayment ? PaymentStatus.PENDING : PaymentStatus.NONE,
    };
  }

  if (requiresPayment) {
    return {
      status: AppointmentStatus.PENDING_PAYMENT,
      approvalStatus: ApprovalStatus.NOT_REQUIRED,
      paymentStatus: PaymentStatus.PENDING,
    };
  }

  return {
    status: AppointmentStatus.CONFIRMED,
    approvalStatus: ApprovalStatus.NOT_REQUIRED,
    paymentStatus: PaymentStatus.NONE,
  };
}
