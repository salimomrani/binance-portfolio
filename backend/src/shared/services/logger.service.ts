import winston from 'winston';
import { env } from '../../config/env.config';
import * as fs from 'fs';
import * as path from 'path';

// Ensure log directory exists
const logDir = path.dirname(env.logging.filePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Helper function to safely stringify objects with circular references
function safeStringify(obj: unknown, indent = 2): string {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    },
    indent
  );
}

// Winston logger configuration
const loggerInstance = winston.createLogger({
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
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
    // All logs
    new winston.transports.File({
      filename: env.logging.filePath,
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  ],
});

// Add console transport in development
if (env.node.isDevelopment) {
  loggerInstance.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length ? safeStringify(meta, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    })
  );
}

export const loggerService = {
  error: (message: string, meta?: unknown) => loggerInstance.error(message, meta),
  warn: (message: string, meta?: unknown) => loggerInstance.warn(message, meta),
  info: (message: string, meta?: unknown) => loggerInstance.info(message, meta),
  debug: (message: string, meta?: unknown) => loggerInstance.debug(message, meta),
};

export const logger = loggerInstance;
export default loggerInstance;
