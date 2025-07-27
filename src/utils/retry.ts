import { log } from "./logger";

interface RetryOptions {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      
      if (attempt === opts.maxRetries) {
        log("error", `Final retry attempt failed`, { 
          attempt, 
          maxRetries: opts.maxRetries, 
          error: message 
        });
        break;
      }

      const delay = opts.delayMs * Math.pow(opts.backoffMultiplier, attempt - 1);
      log("warn", `Request failed, retrying in ${delay}ms`, { 
        attempt, 
        maxRetries: opts.maxRetries, 
        error: message 
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}