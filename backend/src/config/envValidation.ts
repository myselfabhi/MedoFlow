/**
 * Production env validation. Fails fast if required vars are missing.
 */
export const validateProductionEnv = (): void => {
  if (process.env.NODE_ENV !== 'production') return;

  const required: string[] = [];
  if (!process.env.DATABASE_URL) required.push('DATABASE_URL');
  if (!process.env.JWT_SECRET) required.push('JWT_SECRET');
  if (!process.env.CORS_ORIGIN) required.push('CORS_ORIGIN');

  if (required.length > 0) {
    console.error(
      `[FATAL] Production requires these env vars: ${required.join(', ')}`
    );
    process.exit(1);
  }

  // Warn about security-critical optional vars. These are not hard fails
  // because some deployments may intentionally omit them, but they should
  // never be silently missing in a production payment environment.
  if (!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET) {
    console.warn(
      '[WARN] STRIPE_SECRET_KEY is not set — Stripe payment features will not function'
    );
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn(
      '[WARN] STRIPE_WEBHOOK_SECRET is not set — Stripe webhook signature verification is DISABLED. ' +
      'Any party can send spoofed webhook events. Set this before accepting live payments.'
    );
  }
};
