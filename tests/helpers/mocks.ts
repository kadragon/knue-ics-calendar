import { Event } from '../../src/types';

export const mockEvents: Event[] = [
  {
    start: new Date('2024-03-01'),
    end: new Date('2024-03-01'),
    title: '개강일',
  },
  {
    start: new Date('2024-05-15'),
    end: new Date('2024-05-17'),
    title: '중간고사',
  },
  {
    start: new Date('2024-06-01'),
    end: new Date('2024-06-10'),
    title: '기말고사 기간',
  },
];

export const mockLongEvent: Event = {
  start: new Date('2024-06-20'),
  end: new Date('2024-08-30'),
  title: '여름방학',
};

export const mockHtmlResponse = `
<html>
<body>
  <table>
    <thead>
      <tr>
        <th>기간</th>
        <th>일정</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>03 . 01</td>
        <td><a href="./selectSchdleWebView.do?key=542&schdleNum=976">개강일</a></td>
      </tr>
      <tr>
        <td>05 . 15 - 05 . 17</td>
        <td><a href="./selectSchdleWebView.do?key=542&schdleNum=977">중간고사</a></td>
      </tr>
      <tr>
        <td>04 . 01</td>
        <td><a href="./selectSchdleWebView.do?key=542&schdleNum=978">수업보강</a></td>
      </tr>
      <tr>
        <td>05 . 05</td>
        <td><a href="./selectSchdleWebView.do?key=542&schdleNum=979">어린이날</a></td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;

export interface MockKVEntry {
  value: string;
  metadata?: Record<string, unknown>;
}

export class MockKVNamespace {
  private storage = new Map<string, MockKVEntry>();

  get(key: string): Promise<string | null> {
    const entry = this.storage.get(key);
    return Promise.resolve(entry ? entry.value : null);
  }

  async getWithMetadata<T = unknown>(key: string): Promise<
    KVNamespaceGetWithMetadataResult<string, T>
  > {
    const entry = this.storage.get(key);
    return {
      value: entry ? entry.value : null,
      metadata: (entry?.metadata ?? null) as T | null,
      cacheStatus: entry ? "hit" : "miss",
    };
  }

  put(key: string, value: string, options?: { metadata?: Record<string, unknown> }): Promise<void> {
    this.storage.set(key, { value, metadata: options?.metadata });
    return Promise.resolve();
  }

  clear(): void {
    this.storage.clear();
  }
}

export class MockCache {
  private store = new Map<string, Response>();

  async match(request: Request): Promise<Response | undefined> {
    const hit = this.store.get(request.url);
    return hit ? hit.clone() : undefined;
  }

  async put(request: Request, response: Response): Promise<void> {
    this.store.set(request.url, response.clone());
  }

  clear(): void {
    this.store.clear();
  }
}

export class MockCaches {
  default = new MockCache();
}

export function installMockCaches(): { restore(): void } {
  const globalRef = globalThis as unknown as { caches?: CacheStorage };
  const backup = globalRef.caches;
  globalRef.caches = new MockCaches() as unknown as CacheStorage;
  return {
    restore() {
      if (backup) {
        globalRef.caches = backup;
      } else {
        delete globalRef.caches;
      }
    },
  };
}

export const mockEnv = {
  KNUE_CAL_KV: new MockKVNamespace(),
};

export function createMockRequest(
  url: string = 'https://example.com/calendar.ics',
  headers: Record<string, string> = {}
): Request {
  return new Request(url, { headers });
}

export function createMockResponse(body: string, status: number = 200): Response {
  return new Response(body, { status });
}
