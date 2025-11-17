import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment variable schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  API_PREFIX: z.string().default('/api'),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0'),

  // Market Data Provider
  MARKET_DATA_PROVIDER: z.enum(['binance', 'coingecko', 'coinmarketcap']).default('binance'),
  BINANCE_API_KEY: z.string().optional(),
  BINANCE_API_SECRET: z.string().optional(),
  COINGECKO_API_KEY: z.string().optional(),
  COINMARKETCAP_API_KEY: z.string().optional(),

  // Security
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.string().default('10'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:4200'),
  CORS_CREDENTIALS: z.string().default('true'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),

  // Caching
  CACHE_TTL_PRICE: z.string().default('60'), // seconds
  CACHE_TTL_HISTORICAL: z.string().default('300'), // seconds

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('logs/app.log'),
  LOG_ERROR_FILE_PATH: z.string().default('logs/error.log'),
});

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Invalid environment variables');
}

export const env = {
  node: {
    env: parsedEnv.data.NODE_ENV,
    isDevelopment: parsedEnv.data.NODE_ENV === 'development',
    isProduction: parsedEnv.data.NODE_ENV === 'production',
    isTest: parsedEnv.data.NODE_ENV === 'test',
  },
  server: {
    port: parseInt(parsedEnv.data.PORT, 10),
    apiPrefix: parsedEnv.data.API_PREFIX,
  },
  database: {
    url: parsedEnv.data.DATABASE_URL,
  },
  redis: {
    host: parsedEnv.data.REDIS_HOST,
    port: parseInt(parsedEnv.data.REDIS_PORT, 10),
    password: parsedEnv.data.REDIS_PASSWORD,
    db: parseInt(parsedEnv.data.REDIS_DB, 10),
  },
  marketData: {
    provider: parsedEnv.data.MARKET_DATA_PROVIDER,
    binance: {
      apiKey: parsedEnv.data.BINANCE_API_KEY || '',
      apiSecret: parsedEnv.data.BINANCE_API_SECRET || '',
    },
    coingecko: {
      apiKey: parsedEnv.data.COINGECKO_API_KEY || '',
    },
    coinmarketcap: {
      apiKey: parsedEnv.data.COINMARKETCAP_API_KEY || '',
    },
  },
  security: {
    jwtSecret: parsedEnv.data.JWT_SECRET,
    jwtExpiresIn: parsedEnv.data.JWT_EXPIRES_IN,
    bcryptRounds: parseInt(parsedEnv.data.BCRYPT_ROUNDS, 10),
  },
  cors: {
    origin: parsedEnv.data.CORS_ORIGIN,
    credentials: parsedEnv.data.CORS_CREDENTIALS === 'true',
  },
  rateLimit: {
    windowMs: parseInt(parsedEnv.data.RATE_LIMIT_WINDOW_MS, 10),
    max: parseInt(parsedEnv.data.RATE_LIMIT_MAX_REQUESTS, 10),
  },
  cache: {
    ttl: {
      price: parseInt(parsedEnv.data.CACHE_TTL_PRICE, 10),
      historical: parseInt(parsedEnv.data.CACHE_TTL_HISTORICAL, 10),
    },
  },
  logging: {
    level: parsedEnv.data.LOG_LEVEL,
    filePath: parsedEnv.data.LOG_FILE_PATH,
    errorFilePath: parsedEnv.data.LOG_ERROR_FILE_PATH,
  },
};
