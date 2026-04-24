import { PrismaClient } from '@prisma/client'
import { getTenantContext, getIsolationMode } from './tenantContext'

declare global {
  var prisma: PrismaClient | undefined
}

const basePrisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? (['error', 'warn'] as const) : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.prisma = basePrisma
}

/**
 * Models with a direct `clinicId` column — derived from schema.prisma. Must
 * be kept in sync if new clinic-scoped models are added; a CI test should
 * ideally regenerate and diff this list. User is intentionally omitted
 * (auth primitive; look-ups happen by email/id before any clinic context
 * exists). CartItem/InvoiceItem/etc. inherit scope via their parent.
 */
const CLINIC_SCOPED_MODELS = new Set([
  'AIScribeSession',
  'Appointment',
  'AppointmentSeries',
  'AuditLog',
  'Cart',
  'CommissionRecord',
  'CommissionRule',
  'ConsultationSession',
  'CustomRole',
  'Discipline',
  'FormResponse',
  'FormTemplate',
  'GoogleCalendarConnection',
  'GoogleCalendarEvent',
  'InventoryItem',
  'Invoice',
  'Location',
  'Membership',
  'Package',
  'PatientClinicMembership',
  'PatientFile',
  'PatientPackage',
  'PatientSubscription',
  'Payment',
  'Prescription',
  'Product',
  'Provider',
  'Service',
  'SlotHold',
  'TreatmentPlan',
  'VisitRecord',
  'WaitlistEntry',
])

type WhereLike = Record<string, unknown> | undefined | null

/**
 * A where clause is considered clinic-scoped if:
 *  - top-level `clinicId` is set (anything other than undefined), OR
 *  - any entry in a top-level `AND` array sets `clinicId`, OR
 *  - a compound unique key that embeds clinicId is used, e.g.
 *      `{ clinicId_name: { clinicId: 'x', name: 'y' } }`
 *
 * Top-level OR clauses are treated as unscoped — OR-mixing is an easy
 * footgun, and callers can rewrite to AND(clinicId, OR(...)).
 */
function isWhereClinicScoped(where: WhereLike): boolean {
  if (!where) return false
  // direct
  if ('clinicId' in where && where.clinicId !== undefined) return true
  // compound unique: key name contains clinicId, e.g. clinicId_name
  for (const key of Object.keys(where)) {
    if (key.includes('clinicId') && typeof where[key] === 'object' && where[key] !== null) {
      const inner = where[key] as Record<string, unknown>
      if ('clinicId' in inner && inner.clinicId !== undefined) return true
    }
  }
  // AND[] branch
  const and = (where as Record<string, unknown>).AND
  if (Array.isArray(and)) {
    for (const branch of and) {
      if (isWhereClinicScoped(branch as WhereLike)) return true
    }
  }
  return false
}

function isCreateClinicScoped(data: unknown): boolean {
  if (!data) return false
  if (Array.isArray(data)) return data.every((d) => isCreateClinicScoped(d))
  if (typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  if ('clinicId' in d && d.clinicId !== undefined && d.clinicId !== null) return true
  // nested clinic connect: { clinic: { connect: { id } } }
  if (d.clinic && typeof d.clinic === 'object') return true
  return false
}

/**
 * Formats a violation so developers can grep for it in logs. Shallow JSON
 * stringify — deep dumps would blow up log volume.
 */
function describeViolation(model: string, op: string, args: unknown): string {
  let summary = ''
  try {
    summary = JSON.stringify(args, (_, v) => {
      if (typeof v === 'string' && v.length > 80) return v.slice(0, 80) + '…'
      return v
    }).slice(0, 400)
  } catch {
    summary = '[unserializable args]'
  }
  return `tenant-scope violation: ${model}.${op} args=${summary}`
}

const prisma = basePrisma.$extends({
  name: 'tenantScopeGuard',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const mode = getIsolationMode()
        if (mode === 'off') return query(args)
        if (!CLINIC_SCOPED_MODELS.has(model)) return query(args)

        const ctx = getTenantContext()
        // Explicit, named bypass — allowed.
        if (ctx?.bypassReason) return query(args)

        // Reads/updates/deletes: check where clause.
        const readLike = new Set([
          'findUnique',
          'findUniqueOrThrow',
          'findFirst',
          'findFirstOrThrow',
          'findMany',
          'count',
          'aggregate',
          'groupBy',
          'update',
          'updateMany',
          'delete',
          'deleteMany',
          'upsert',
        ])
        if (readLike.has(operation)) {
          const where = (args as { where?: WhereLike } | undefined)?.where
          if (isWhereClinicScoped(where)) return query(args)

          // Not scoped. Emit violation.
          const message = describeViolation(model, operation, args)
          if (mode === 'warn') {
            // eslint-disable-next-line no-console
            console.warn('[tenant-guard:WARN]', message)
            return query(args)
          }
          const err = new Error(
            `Tenant isolation violation: ${model}.${operation} called without a clinicId filter. ` +
              `Scope the query with \`where: { clinicId, … }\`, or wrap legitimate cross-tenant ` +
              `operations in \`withTenantBypass("reason", () => …)\`.`
          )
          ;(err as Error & { code?: string }).code = 'tenant_scope_required'
          throw err
        }

        // Creates: check data.clinicId or data.clinic.connect.
        if (operation === 'create' || operation === 'createMany' || operation === 'upsert') {
          const data =
            operation === 'upsert'
              ? (args as { create?: unknown; update?: unknown })?.create
              : (args as { data?: unknown })?.data
          if (isCreateClinicScoped(data)) return query(args)

          const message = describeViolation(model, operation, args)
          if (mode === 'warn') {
            // eslint-disable-next-line no-console
            console.warn('[tenant-guard:WARN]', message)
            return query(args)
          }
          const err = new Error(
            `Tenant isolation violation: ${model}.${operation} called without a clinicId in data. ` +
              `Set \`data.clinicId\`, or wrap legitimate cross-tenant operations in \`withTenantBypass\`.`
          )
          ;(err as Error & { code?: string }).code = 'tenant_scope_required'
          throw err
        }

        // Unknown operation — pass through.
        return query(args)
      },
    },
  },
})

export default prisma
export type AppPrisma = typeof prisma
