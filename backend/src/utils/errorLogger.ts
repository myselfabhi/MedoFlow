import fs from 'fs';
import path from 'path';

export const logError = (err: unknown, context?: Record<string, unknown>): void => {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  const payload = {
    timestamp: new Date().toISOString(),
    message,
    stack,
    ...context,
  };
  if (process.env.NODE_ENV === 'production') {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      fs.appendFileSync(
        path.join(logDir, 'errors.log'),
        JSON.stringify(payload) + '\n'
      );
    } catch {
      process.stderr.write(JSON.stringify(payload) + '\n');
    }
  } else {
    process.stderr.write(JSON.stringify(payload, null, 2) + '\n');
  }
};
