import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { ApiError } from './types/errors';

const app = express();

app.use(helmet());
const corsOrigin = process.env.CORS_ORIGIN;
const isProduction = process.env.NODE_ENV === 'production';
app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = corsOrigin
        ? corsOrigin.split(',').map((o) => o.trim()).filter(Boolean)
        : [];
      // In production, require CORS_ORIGIN to be set; fail closed if not
      if (isProduction && allowed.length === 0) {
        cb(null, false);
        return;
      }
      // Same-origin / server-side requests (no origin) are allowed
      if (!origin) {
        cb(null, true);
        return;
      }
      // In development, allow localhost when CORS_ORIGIN is not set
      if (!isProduction && allowed.length === 0) {
        const isLocalhost =
          origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
        cb(null, isLocalhost);
        return;
      }
      const isVercelPreview = origin.endsWith('.vercel.app');
      const isAllowed =
        allowed.includes(origin) ||
        (isVercelPreview && allowed.some((o) => o.includes('vercel.app')));
      cb(null, isAllowed);
    },
    credentials: true,
  })
);
app.use(morgan('combined'));
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', routes);

app.use((_req, _res, next) => {
  const err = new Error('Not Found') as ApiError;
  err.statusCode = 404;
  next(err);
});

app.use(errorHandler);

export default app;
