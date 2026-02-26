require('dotenv').config();
const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 3000;
let server;

const connectDatabase = async () => {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

const startServer = () => {
  server = app.listen(PORT, () => {
    console.log(`Medoflow server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
};

const gracefulShutdown = async (signal) => {
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

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const bootstrap = async () => {
  await connectDatabase();
  startServer();
};

bootstrap();
