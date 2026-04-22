import assert from 'node:assert/strict'
import {
  PaymentRequirementType,
  AppointmentStatus,
  ApprovalStatus,
  PaymentStatus,
} from '@prisma/client'
import {
  buildCandidateSlots,
  isSlotWithinSchedules,
  rangeOverlaps,
  resolveAppointmentLifecycle,
} from '../services/schedulingCore'

test('Any Available slots retain surfaced provider identity', () => {
  const slots = buildCandidateSlots({
    date: '2026-03-12',
    timezone: 'America/New_York',
    locationId: 'loc-1',
    providerId: 'provider-a',
    serviceId: 'service-1',
    durationMinutes: 60,
    schedules: [{ startTime: '09:00', endTime: '10:00' }],
    blocked: [],
    stepMinutes: 60,
  })

  assert.equal(slots.length, 1)
  assert.equal(slots[0]?.providerId, 'provider-a')
  assert.equal(slots[0]?.locationId, 'loc-1')
})

test('active hold blocks duplicate booking exposure', () => {
  // Use UTC to avoid DST variance. Schedule 14:00-15:00 UTC -> slots at 14:00 and 14:30.
  // Block 14:00-14:30 excludes first slot -> only 14:30-15:00 remains.
  const slots = buildCandidateSlots({
    date: '2026-03-12',
    timezone: 'UTC',
    locationId: 'loc-1',
    providerId: 'provider-a',
    serviceId: 'service-1',
    durationMinutes: 30,
    schedules: [{ startTime: '14:00', endTime: '15:00' }],
    blocked: [
      {
        start: new Date('2026-03-12T14:00:00.000Z'),
        end: new Date('2026-03-12T14:30:00.000Z'),
      },
    ],
    stepMinutes: 30,
  })

  assert.equal(slots.length, 1)
  assert.equal(slots[0]?.start, '2026-03-12T14:30:00.000Z')
})

test('expired hold no longer blocks availability once removed from blocked intervals', () => {
  const slots = buildCandidateSlots({
    date: '2026-03-12',
    timezone: 'America/New_York',
    locationId: 'loc-1',
    providerId: 'provider-a',
    serviceId: 'service-1',
    durationMinutes: 30,
    schedules: [{ startTime: '09:00', endTime: '10:00' }],
    blocked: [],
    stepMinutes: 30,
  })

  assert.equal(slots.length, 2)
})

test('default slot stepping uses 30-minute booking windows', () => {
  const slots = buildCandidateSlots({
    date: '2026-03-12',
    timezone: 'UTC',
    locationId: 'loc-1',
    providerId: 'provider-a',
    serviceId: 'service-1',
    durationMinutes: 30,
    schedules: [{ startTime: '09:00', endTime: '10:00' }],
    blocked: [],
  })

  assert.equal(slots.length, 2)
  assert.equal(slots[0]?.start, '2026-03-12T09:00:00.000Z')
  assert.equal(slots[1]?.start, '2026-03-12T09:30:00.000Z')
})

test('overlapping provider or patient booking ranges are rejected by overlap logic', () => {
  assert.equal(
    rangeOverlaps(
      {
        start: new Date('2026-03-12T14:00:00.000Z'),
        end: new Date('2026-03-12T14:30:00.000Z'),
      },
      {
        start: new Date('2026-03-12T14:15:00.000Z'),
        end: new Date('2026-03-12T14:45:00.000Z'),
      }
    ),
    true
  )
})

test('reschedule must use a slot that fits surfaced availability', () => {
  // Use UTC for deterministic behavior. Schedule 14:00-15:00 UTC.
  const valid = isSlotWithinSchedules({
    date: '2026-03-12',
    timezone: 'UTC',
    start: new Date('2026-03-12T14:00:00.000Z'),
    end: new Date('2026-03-12T14:30:00.000Z'),
    schedules: [{ startTime: '14:00', endTime: '15:00' }],
  })

  const invalid = isSlotWithinSchedules({
    date: '2026-03-12',
    timezone: 'UTC',
    start: new Date('2026-03-12T18:00:00.000Z'),
    end: new Date('2026-03-12T18:30:00.000Z'),
    schedules: [{ startTime: '14:00', endTime: '15:00' }],
  })

  assert.equal(valid, true)
  assert.equal(invalid, false)
})

test('pending approval and pending payment transitions behave correctly', () => {
  const approvalLifecycle = resolveAppointmentLifecycle({
    requiresProviderApproval: true,
    paymentRequirementType: PaymentRequirementType.FULL,
  })

  assert.deepEqual(approvalLifecycle, {
    status: AppointmentStatus.PENDING_PAYMENT,
    approvalStatus: ApprovalStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
  })

  const paymentLifecycle = resolveAppointmentLifecycle({
    requiresProviderApproval: false,
    paymentRequirementType: PaymentRequirementType.DEPOSIT,
  })

  assert.deepEqual(paymentLifecycle, {
    status: AppointmentStatus.PENDING_PAYMENT,
    approvalStatus: ApprovalStatus.NOT_REQUIRED,
    paymentStatus: PaymentStatus.PENDING,
  })
})

test('provider approval is the next appointment status only after payment clears', () => {
  const lifecycle = resolveAppointmentLifecycle({
    requiresProviderApproval: true,
    paymentRequirementType: PaymentRequirementType.NONE,
  })

  assert.deepEqual(lifecycle, {
    status: AppointmentStatus.PENDING_PROVIDER_APPROVAL,
    approvalStatus: ApprovalStatus.PENDING,
    paymentStatus: PaymentStatus.NONE,
  })
})
