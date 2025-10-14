import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry } from '../../src/utils/retry';

describe('Retry Utility', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return result on first success', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    vi.useFakeTimers();
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const promise = withRetry(mockFn, { maxRetries: 2, delayMs: 100, jitterMs: 50 });

    // Fast forward past the delay + jitter (100 + up to 50)
    await vi.advanceTimersByTimeAsync(200);

    const result = await promise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('should throw error after max retries exceeded', async () => {
    const error = new Error('persistent failure');
    const mockFn = vi.fn().mockRejectedValue(error);

    const promise = withRetry(mockFn, { maxRetries: 2, delayMs: 0, jitterMs: 0 });

    await expect(promise).rejects.toThrow('persistent failure');
    expect(mockFn).toHaveBeenCalledTimes(2);
  }, 30000);

  it('should use exponential backoff', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('fail'));

    const promise = withRetry(mockFn, {
      maxRetries: 3,
      delayMs: 0,
      backoffMultiplier: 2,
      jitterMs: 0
    });

    await expect(promise).rejects.toThrow('fail');
    expect(mockFn).toHaveBeenCalledTimes(3);
  }, 30000);

  it('should handle non-Error thrown values', async () => {
    const mockFn = vi.fn().mockRejectedValue('string error');
    
    const promise = withRetry(mockFn, { maxRetries: 1 });
    
    await expect(promise).rejects.toBe('string error');
  });

  it('should use default options when not provided', async () => {
    vi.useFakeTimers();
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const promise = withRetry(mockFn);

    // Default delay is 1000ms + jitter (up to 1000ms)
    await vi.advanceTimersByTimeAsync(2500);

    const result = await promise;
    expect(result).toBe('success');
    vi.useRealTimers();
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
      delayMs: 0,
      jitterMs: 50,
      backoffMultiplier: 2
    });

    await expect(promise).rejects.toThrow('fail');
    expect(mockFn).toHaveBeenCalledTimes(2);

    // Restore original Math.random
    Math.random = originalRandom;
  }, 30000);

  it('should work without jitter when jitterMs is 0', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('fail'));

    const promise = withRetry(mockFn, {
      maxRetries: 2,
      delayMs: 0,
      jitterMs: 0
    });

    await expect(promise).rejects.toThrow('fail');
    expect(mockFn).toHaveBeenCalledTimes(2);
  }, 30000);
});
