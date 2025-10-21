import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import worker from '../src/index';
import type { Env } from '../src/types';
import { createMockRequest, MockKVNamespace, installMockCaches } from './helpers/mocks';
import { CACHE_KEY } from '../src/constants';
import { generateEtag } from '../src/utils/etag';

vi.mock('../src/parser', () => ({
  getEventsFromSite: vi.fn().mockResolvedValue([
    {
      start: new Date('2024-03-01'),
      end: new Date('2024-03-01'),
      title: '개강일',
    },
  ]),
}));

describe('Worker Cache Integration', () => {
  let kv: MockKVNamespace;
  let env: Env;
  let cacheRestore: { restore(): void };

  beforeEach(() => {
    kv = new MockKVNamespace();
    env = { KNUE_CAL_KV: kv as unknown as KVNamespace };

    cacheRestore = installMockCaches();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cacheRestore.restore();
  });

  it('serves ICS from cache when entry is warmed', async () => {
    const icsContent = 'BEGIN:VCALENDAR\nEND:VCALENDAR';
    const cacheResponse = new Response(icsContent, {
      headers: {
        'content-type': 'text/calendar; charset=utf-8',
        'cache-control': 'public, max-age=86400',
        'etag': '"abc123"',
        'last-modified': new Date().toUTCString(),
      },
    });

    await caches.default.put(new Request(CACHE_KEY), cacheResponse);

    const request = createMockRequest('https://example.com/events.ics');
    const response = await worker.fetch(request, env);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(icsContent);
  });

  it('backfills cache from KV when cache miss occurs', async () => {
    const icsContent = 'BEGIN:VCALENDAR\nEND:VCALENDAR';
    const updatedAt = new Date().toISOString();
    await kv.put('latest', icsContent, {
      metadata: {
        updatedAt,
        etag: '"test-etag"',
      },
    });

    const request = createMockRequest('https://example.com/events.ics');
    const response = await worker.fetch(request, env);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(icsContent);
    expect(response.headers.get('last-modified')).toBe(new Date(updatedAt).toUTCString());

    const warmed = await caches.default.match(new Request(CACHE_KEY));
    expect(warmed).toBeDefined();
  });

  it('warms cache after scheduled run', async () => {
    const mockController = {} as ScheduledController;

    await worker.scheduled(mockController, env);

    const cached = await caches.default.match(new Request(CACHE_KEY));
    expect(cached).toBeDefined();
  });

  it('handles missing metadata gracefully with fallback', async () => {
    const icsContent = 'BEGIN:VCALENDAR\nEND:VCALENDAR';
    // Simulate legacy data without metadata
    await kv.put('latest', icsContent);

    const request = createMockRequest('https://example.com/events.ics');
    const response = await worker.fetch(request, env);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(icsContent);
    // Should still have a Last-Modified header (fallback to current time)
    expect(response.headers.get('last-modified')).toBeDefined();
    expect(response.headers.get('etag')).toBe(await generateEtag(icsContent));
  });
});
