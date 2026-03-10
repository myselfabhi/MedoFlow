import 'dotenv/config';
import { validateProductionEnv } from './config/envValidation';
import app from './app';
import prisma from './config/prisma';
import { startCronJobs } from './scheduler/cronJobs';
import { createAiScribeWorker } from './queues/aiScribeQueue';
import { Server } from 'http';

const PORT = process.env.PORT || 3000;
let server: Server;

const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error(
      'Database connection failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    process.exit(1);
  }
};

const startServer = (): void => {
  server = app.listen(PORT, () => {
    console.log(
      `Medoflow server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`
    );
  });
};

const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`${signal} received. Starting graceful shutdown...`);
  if (aiScribeWorker) {
    await aiScribeWorker.close();
    console.log('AI Scribe worker closed.');
  }
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await prisma.$disconnect();
        console.log('Database connection closed.');
        process.exit(0);
      } catch (error) {
        console.error('Error during database disconnection:', error);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

let aiScribeWorker: ReturnType<typeof createAiScribeWorker> | null = null;

const bootstrap = async (): Promise<void> => {
  validateProductionEnv();
  await connectDatabase();
  startCronJobs();
  try {
    aiScribeWorker = createAiScribeWorker();
    console.log('AI Scribe worker started (transcription will run when Redis is available)');
  } catch (err) {
    console.warn(
      'AI Scribe worker not started — transcription will stay "Processing" until Redis is running and the server is restarted:',
      err instanceof Error ? err.message : err
    );
  }
  startServer();
};

bootstrap();
