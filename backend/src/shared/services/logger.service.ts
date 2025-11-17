import winston from 'winston';
import { env } from '../../config/env.config';
import * as fs from 'fs';
import * as path from 'path';

// Ensure log directory exists
const logDir = path.dirname(env.logging.filePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Winston logger configuration
const logger = winston.createLogger({
  level: env.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'crypto-portfolio-api' },
  transports: [
    // Error logs (separate file)
    new winston.transports.File({
      filename: env.logging.errorFilePath,
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // All logs
    new winston.transports.File({
      filename: env.logging.filePath,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

// Add console transport in development
if (env.node.isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    })
  );
}

export const loggerService = {
  error: (message: string, meta?: unknown) => logger.error(message, meta),
  warn: (message: string, meta?: unknown) => logger.warn(message, meta),
  info: (message: string, meta?: unknown) => logger.info(message, meta),
  debug: (message: string, meta?: unknown) => logger.debug(message, meta),
};

export default logger;
