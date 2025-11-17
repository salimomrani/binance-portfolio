import { loggerService } from '../services/logger.service';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export interface LegacyRetryOptions extends RetryOptions {
  retries?: number;
  delay?: number;
}
const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: [],
};

/**
 * Execute a function with exponential backoff retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let attempt = 1;
  let delay = opts.initialDelay;

  while (attempt <= opts.maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === opts.maxAttempts;
      const isRetryable = shouldRetry(error, opts.retryableErrors);

      if (isLastAttempt || !isRetryable) {
        loggerService.error(`Failed after ${attempt} attempts`, { error });
        throw error;
      }

      loggerService.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, {
        error: error instanceof Error ? error.message : String(error),
      });

      await sleep(delay);

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
      attempt++;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('Retry logic failed unexpectedly');
}

/**
 * Backwards-compatible helper that supports { retries, delay } signature
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: LegacyRetryOptions = {}
): Promise<T> {
  const { retries, delay, ...rest } = options;

  const normalized: RetryOptions = {
    ...rest,
    maxAttempts: rest.maxAttempts ?? retries ?? DEFAULT_OPTIONS.maxAttempts,
    initialDelay: rest.initialDelay ?? delay ?? DEFAULT_OPTIONS.initialDelay,
    maxDelay: rest.maxDelay ?? DEFAULT_OPTIONS.maxDelay,
    backoffMultiplier: rest.backoffMultiplier ?? DEFAULT_OPTIONS.backoffMultiplier,
    retryableErrors: rest.retryableErrors ?? DEFAULT_OPTIONS.retryableErrors,
  };

  return withRetry(fn, normalized);
}

/**
 * Check if error should be retried
 */
function shouldRetry(error: unknown, retryableErrors: string[]): boolean {
  if (retryableErrors.length === 0) {
    return true; // Retry all errors by default
  }

  if (error instanceof Error) {
    return retryableErrors.some(
      (errorType) =>
        error.name === errorType || error.message.includes(errorType)
    );
  }

  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry decorator for class methods
 */
export function Retry(options: RetryOptions = {}) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      return withRetry(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}
