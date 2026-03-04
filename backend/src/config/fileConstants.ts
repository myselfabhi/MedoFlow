export const MIME_WHITELIST = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
] as const;

export const FILE_SIZE_LIMIT_BYTES =
  parseInt(process.env.FILE_SIZE_LIMIT_MB || '10', 10) * 1024 * 1024;

export const isMimeAllowed = (mime: string): boolean =>
  MIME_WHITELIST.some(
    (allowed) =>
      mime.toLowerCase() === allowed ||
      mime.toLowerCase().startsWith(allowed.split('/')[0] + '/')
  );
