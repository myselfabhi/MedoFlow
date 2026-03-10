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
};
