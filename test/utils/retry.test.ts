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
    
    const promise = withRetry(mockFn, { maxRetries: 2, delayMs: 100 });
    
    // Fast forward past the delay
    await vi.advanceTimersByTimeAsync(100);
    
    const result = await promise;
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should throw error after max retries exceeded', async () => {
    const error = new Error('persistent failure');
    const mockFn = vi.fn().mockRejectedValue(error);
    
    const promise = withRetry(mockFn, { maxRetries: 2, delayMs: 100 });
    
    // Fast forward past all delays
    await vi.advanceTimersByTimeAsync(300);
    
    await expect(promise).rejects.toThrow('persistent failure');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('fail'));
    
    const promise = withRetry(mockFn, { 
      maxRetries: 3, 
      delayMs: 100, 
      backoffMultiplier: 2 
    });
    
    // First retry: 100ms
    await vi.advanceTimersByTimeAsync(100);
    // Second retry: 200ms
    await vi.advanceTimersByTimeAsync(200);
    
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
    
    // Default delay is 1000ms
    await vi.advanceTimersByTimeAsync(1000);
    
    const result = await promise;
    expect(result).toBe('success');
  });
});