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
  <table class="more_year">
    <tbody>
      <tr>
        <td class="more_link">개강일</td>
        <td class="start">3.1</td>
        <td class="end"></td>
      </tr>
      <tr>
        <td class="more_link">중간고사</td>
        <td class="start">5.15</td>
        <td class="end">5.17</td>
      </tr>
      <tr>
        <td class="more_link">수업보강</td>
        <td class="start">4.1</td>
        <td class="end"></td>
      </tr>
      <tr>
        <td class="more_link">어린이날</td>
        <td class="start">5.5</td>
        <td class="end"></td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;

export class MockKVNamespace {
  private storage = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async put(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  clear(): void {
    this.storage.clear();
  }
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