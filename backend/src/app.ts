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
app.use(cors({ origin: true, credentials: true }));
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
