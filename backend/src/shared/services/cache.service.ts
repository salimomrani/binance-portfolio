import Redis from 'ioredis';
import { env } from '../../config/env.config';
import { loggerService } from './logger.service';

/**
 * Cache Service with Redis and in-memory fallback
 */
class CacheService {
  private redis: Redis | null = null;
  private memoryCache: Map<string, { value: string; expiry: number }> = new Map();
  private isRedisAvailable = false;

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    try {
      this.redis = new Redis({
        host: env.redis.host,
        port: env.redis.port,
        password: env.redis.password,
        db: env.redis.db,
        retryStrategy: (times) => {
          if (times > 3) {
            loggerService.warn('Redis connection failed, using in-memory cache');
            return null;
          }
          return Math.min(times * 50, 2000);
        },
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.isRedisAvailable = true;
        loggerService.info('✅ Redis connected successfully');
      });

      this.redis.on('error', (error) => {
        this.isRedisAvailable = false;
        loggerService.error('Redis error, falling back to memory cache', error);
      });

      // Attempt to connect
      this.redis.connect().catch((error) => {
        loggerService.warn('Failed to connect to Redis, using memory cache', error);
      });
    } catch (error) {
      loggerService.error('Failed to initialize Redis', error);
    }
  }

  /**
   * Set cache value with optional TTL (in seconds)
   */
  async set(key: string, value: string | object, ttl?: number): Promise<void> {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;

    if (this.isRedisAvailable && this.redis) {
      try {
        if (ttl) {
          await this.redis.setex(key, ttl, stringValue);
        } else {
          await this.redis.set(key, stringValue);
        }
        return;
      } catch (error) {
        loggerService.error('Redis set error, using memory cache', error);
      }
    }

    // Fallback to memory cache
    const expiry = ttl ? Date.now() + ttl * 1000 : Number.MAX_SAFE_INTEGER;
    this.memoryCache.set(key, { value: stringValue, expiry });
  }

  /**
   * Get cache value
   */
  async get<T = string>(key: string): Promise<T | null> {
    if (this.isRedisAvailable && this.redis) {
      try {
        const value = await this.redis.get(key);
        if (value === null) return null;

        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      } catch (error) {
        loggerService.error('Redis get error, using memory cache', error);
      }
    }

    // Fallback to memory cache
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.memoryCache.delete(key);
      return null;
    }

    try {
      return JSON.parse(cached.value) as T;
    } catch {
      return cached.value as T;
    }
  }

  /**
   * Delete cache key
   */
  async delete(key: string): Promise<void> {
    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.del(key);
        return;
      } catch (error) {
        loggerService.error('Redis delete error', error);
      }
    }

    this.memoryCache.delete(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (this.isRedisAvailable && this.redis) {
      try {
        const exists = await this.redis.exists(key);
        return exists === 1;
      } catch (error) {
        loggerService.error('Redis exists error', error);
      }
    }

    const cached = this.memoryCache.get(key);
    if (!cached) return false;
    if (Date.now() > cached.expiry) {
      this.memoryCache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Clear all cache (use with caution!)
   */
  async clear(): Promise<void> {
    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.flushdb();
        return;
      } catch (error) {
        loggerService.error('Redis clear error', error);
      }
    }

    this.memoryCache.clear();
  }

  /**
   * Clean up expired entries from memory cache
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (now > value.expiry) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      loggerService.info('Redis disconnected');
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Cleanup memory cache every 5 minutes
setInterval(() => {
  (cacheService as any).cleanupMemoryCache();
}, 5 * 60 * 1000);
