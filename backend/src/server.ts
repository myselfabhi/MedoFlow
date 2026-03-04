import 'dotenv/config';
import app from './app';
import prisma from './config/prisma';
import { startCronJobs } from './scheduler/cronJobs';
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

const bootstrap = async (): Promise<void> => {
  await connectDatabase();
  startCronJobs();
  startServer();
};

bootstrap();
