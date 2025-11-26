import { log } from "./logger";

interface RetryOptions {
	maxRetries: number;
	delayMs: number;
	backoffMultiplier: number;
	jitterMs: number;
}

const DEFAULT_OPTIONS: RetryOptions = {
	maxRetries: 3,
	delayMs: 1000,
	backoffMultiplier: 2,
	jitterMs: 1000, // Add up to 1 second of random jitter
};

/**
 * Retry a function with exponential backoff and jitter
 *
 * Uses exponential backoff to gradually increase delay between retries.
 * Adds random jitter to prevent thundering herd problem when multiple
 * clients retry at the same time after a failure.
 *
 * @param fn - The function to retry
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function result or rejects with the last error
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	options: Partial<RetryOptions> = {},
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
					error: message,
				});
				break;
			}

			// Calculate delay with exponential backoff and jitter to prevent thundering herd
			const baseDelay = opts.delayMs * opts.backoffMultiplier ** (attempt - 1);
			const jitter = Math.floor(Math.random() * opts.jitterMs);
			const delay = baseDelay + jitter;

			log("warn", `Request failed, retrying in ${delay}ms`, {
				attempt,
				maxRetries: opts.maxRetries,
				error: message,
			});

			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}
