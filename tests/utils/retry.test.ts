import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry } from '../../src/utils/retry';

describe('Retry Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should return result on first success', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const promise = withRetry(mockFn, { maxRetries: 2, delayMs: 100, jitterMs: 50 });

    // Fast forward past the delay + jitter (100 + up to 50)
    await vi.advanceTimersByTimeAsync(200);

    const result = await promise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should throw error after max retries exceeded', async () => {
    const error = new Error('persistent failure');
    const mockFn = vi.fn().mockRejectedValue(error);

    const promise = withRetry(mockFn, { maxRetries: 2, delayMs: 100, jitterMs: 50 });

    // Fast forward past all delays + jitter (100 + up to 50)
    await vi.advanceTimersByTimeAsync(200);

    await expect(promise).rejects.toThrow('persistent failure');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('fail'));

    const promise = withRetry(mockFn, {
      maxRetries: 3,
      delayMs: 100,
      backoffMultiplier: 2,
      jitterMs: 50
    });

    // Advance through all retry delays + jitter
    // First retry: 100 + up to 50ms, Second retry: 200 + up to 50ms
    await vi.advanceTimersByTimeAsync(500);

    await expect(promise).rejects.toThrow('fail');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should handle non-Error thrown values', async () => {
    const mockFn = vi.fn().mockRejectedValue('string error');
    
    const promise = withRetry(mockFn, { maxRetries: 1 });
    
    await expect(promise).rejects.toBe('string error');
  });

  it('should use default options when not provided', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    
    const promise = withRetry(mockFn);
    
    // Default delay is 1000ms + jitter (up to 1000ms)
    await vi.advanceTimersByTimeAsync(2500);
    
    const result = await promise;
    expect(result).toBe('success');
  });

  it('should add jitter to prevent thundering herd', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('fail'));

    // Mock Math.random to return predictable values
    const originalRandom = Math.random;
    let callCount = 0;
    Math.random = vi.fn(() => {
      // Return different values for each call: 0.5, 0.8
      const values = [0.5, 0.8];
      return values[callCount++ % values.length];
    });

    const promise = withRetry(mockFn, {
      maxRetries: 2,
      delayMs: 100,
      jitterMs: 50,
      backoffMultiplier: 2
    });

    // Expected delays:
    // Retry 1: 100 + (0.5 * 50) = 125ms
    await vi.advanceTimersByTimeAsync(200);

    await expect(promise).rejects.toThrow('fail');
    expect(mockFn).toHaveBeenCalledTimes(2);

    // Restore original Math.random
    Math.random = originalRandom;
  });

  it('should work without jitter when jitterMs is 0', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('fail'));

    const promise = withRetry(mockFn, {
      maxRetries: 2,
      delayMs: 100,
      jitterMs: 0
    });

    // Should use exact delays without jitter
    await vi.advanceTimersByTimeAsync(200);

    await expect(promise).rejects.toThrow('fail');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
