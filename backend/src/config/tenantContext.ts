/**
 * Request-scoped tenant context, carried through async boundaries via
 * AsyncLocalStorage. Populated by the Express middleware `bindTenantContext`
 * after `protect` runs, and consumed by the Prisma client extension in
 * `config/prisma.ts` to enforce clinic scoping on every query.
 *
 * Design notes:
 *  - The context is OPT-IN at the request level. If a request never runs
 *    through `bindTenantContext` (e.g. a background job), Prisma queries
 *    against clinic-scoped models will fail in enforce mode. That's
 *    intentional — background jobs MUST call `withTenantBypass(reason, fn)`
 *    or `withTenantContext(ctx, fn)` to declare their scope explicitly.
 *  - Bypass is a named escape hatch, not a silent flag. Every bypass
 *    carries a reason string so a future audit can grep for them.
 *  - We carry `userId` too for audit correlation only — the bypass logic
 *    does not consult it.
 */

import { AsyncLocalStorage } from 'async_hooks'

export interface TenantContext {
  clinicId: string | null
  tenantId: string | null
  userId: string | null
  role: string | null
  /**
   * Non-null => query extension skips the clinicId assertion. The value is
   * the human-readable reason for the bypass, logged for audit.
   */
  bypassReason: string | null
}

const storage = new AsyncLocalStorage<TenantContext>()

export function getTenantContext(): TenantContext | undefined {
  return storage.getStore()
}

export function withTenantContext<T>(ctx: TenantContext, fn: () => T): T {
  return storage.run(ctx, fn)
}

/**
 * Run a function with the current tenant scope bypassed. Every call site
 * MUST pass a descriptive reason — these are logged and reviewed.
 *
 * Legitimate uses:
 *  - auth flows before a user is authenticated (login, signup, refresh)
 *  - platform-admin cross-tenant operations
 *  - signup that creates the first tenant/clinic/user (no context yet)
 *  - public webhooks (stripe) — use the embedded tenantId from metadata
 *
 * Misuse note: do NOT wrap a handler in `withTenantBypass` just to make
 * a failing query stop failing. The failure means the query is missing a
 * clinicId filter — fix the query, don't bypass the guard.
 */
export function withTenantBypass<T>(reason: string, fn: () => T): T {
  const prev = storage.getStore()
  const next: TenantContext = {
    clinicId: prev?.clinicId ?? null,
    tenantId: prev?.tenantId ?? null,
    userId: prev?.userId ?? null,
    role: prev?.role ?? null,
    bypassReason: reason,
  }
  return storage.run(next, fn)
}

/**
 * Isolation modes:
 *  - off      — extension inactive. Identical behavior to before this PR.
 *  - warn     — violations are logged with model/operation/where, but the
 *               query still runs. Safe to deploy; gives a full picture of
 *               what would break under enforcement.
 *  - enforce  — violations throw. Any query on a clinic-scoped model that
 *               doesn't include a clinicId filter and has no active bypass
 *               gets rejected before hitting Postgres.
 */
export type IsolationMode = 'off' | 'warn' | 'enforce'

export function getIsolationMode(): IsolationMode {
  const raw = (process.env.TENANT_ISOLATION_MODE ?? 'warn').toLowerCase()
  if (raw === 'off' || raw === 'warn' || raw === 'enforce') return raw
  return 'warn'
}
