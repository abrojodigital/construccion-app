import { createApp } from './app';
import { config } from './config';
import { prisma } from '@construccion/database';

async function bootstrap() {
  const app = createApp();

  // Test database connection
  try {
    await prisma.$connect();
    console.log('✓ Database connected successfully');
  } catch (error) {
    console.error('✗ Failed to connect to database:', error);
    process.exit(1);
  }

  // Start server
  const server = app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🏗️  Sistema de Gestión de Construcción - API               ║
║                                                              ║
║   Server running on: http://localhost:${config.port}                 ║
║   Environment: ${config.env.padEnd(46)}║
║                                                              ║
║   Endpoints:                                                 ║
║   • Health: GET /api/v1/health                               ║
║   • Auth:   POST /api/v1/auth/login                          ║
║   • Docs:   /api/v1/* (see README for full API reference)    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down gracefully...');

    server.close(async () => {
      await prisma.$disconnect();
      console.log('Server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
