import { createApp } from './app';
import { env } from './config/env.config';
import { connectDatabase, disconnectDatabase } from './config/database.config';
import { cacheService } from './shared/services/cache.service';
import { loggerService } from './shared/services/logger.service';

/**
 * Start the server
 */
async function start(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(env.server.port, () => {
      loggerService.info(`
🚀 Server is running!
📍 URL: http://localhost:${env.server.port}
📍 API: http://localhost:${env.server.port}${env.server.apiPrefix}
📍 Health: http://localhost:${env.server.port}/health
🌍 Environment: ${env.node.env}
      `);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      loggerService.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        loggerService.info('HTTP server closed');

        try {
          await disconnectDatabase();
          await cacheService.disconnect();
          loggerService.info('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          loggerService.error('❌ Error during shutdown', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        loggerService.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    loggerService.error('❌ Failed to start server', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  start();
}

export { start };
