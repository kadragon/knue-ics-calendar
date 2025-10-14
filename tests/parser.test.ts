import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getEventsFromSite } from '../src/parser';
import { mockHtmlResponse } from './helpers/mocks';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.restoreAllMocks();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Parser', () => {
  it('should parse events from HTML response', async () => {
    fetchMock.mockResolvedValue(new Response(mockHtmlResponse));

    const events = await getEventsFromSite(2024);

    expect(events).toHaveLength(2); // Should filter out holidays and 수업보강
    expect(events[0].title).toBe('개강일');
    expect(events[1].title).toBe('중간고사');
  });

  it('should filter out holidays', async () => {
    const htmlWithHoliday = `
      <table class="more_year">
        <tbody>
          <tr>
            <td class="more_link">어린이날</td>
            <td class="start">5.5</td>
            <td class="end"></td>
          </tr>
          <tr>
            <td class="more_link">정상 이벤트</td>
            <td class="start">5.10</td>
            <td class="end"></td>
          </tr>
        </tbody>
      </table>
    `;

    fetchMock.mockResolvedValue(new Response(htmlWithHoliday));

    const events = await getEventsFromSite(2024);

    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('정상 이벤트');
  });

  it('should filter out 수업보강 events', async () => {
    const htmlWithMakeup = `
      <table class="more_year">
        <tbody>
          <tr>
            <td class="more_link">수업보강</td>
            <td class="start">4.1</td>
            <td class="end"></td>
          </tr>
          <tr>
            <td class="more_link">정상 이벤트</td>
            <td class="start">4.2</td>
            <td class="end"></td>
          </tr>
        </tbody>
      </table>
    `;

    fetchMock.mockResolvedValue(new Response(htmlWithMakeup));

    const events = await getEventsFromSite(2024);

    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('정상 이벤트');
  });

  it('should handle events with end dates', async () => {
    fetchMock.mockResolvedValue(new Response(mockHtmlResponse));

    const events = await getEventsFromSite(2024);
    const midtermEvent = events.find(e => e.title === '중간고사');

    expect(midtermEvent).toBeDefined();
    expect(midtermEvent!.start).toEqual(new Date('2024-05-15'));
    expect(midtermEvent!.end).toEqual(new Date('2024-05-17'));
  });

  it('should handle events without end dates', async () => {
    fetchMock.mockResolvedValue(new Response(mockHtmlResponse));

    const events = await getEventsFromSite(2024);
    const startEvent = events.find(e => e.title === '개강일');

    expect(startEvent).toBeDefined();
    expect(startEvent!.start).toEqual(new Date('2024-03-01'));
    expect(startEvent!.end).toEqual(new Date('2024-03-01'));
  });

  it('should handle cross-year academic calendar', async () => {
    const htmlCrossYear = `
      <table class="more_year">
        <tbody>
          <tr>
            <td class="more_link">겨울방학</td>
            <td class="start">1.15</td>
            <td class="end">2.28</td>
          </tr>
          <tr>
            <td class="more_link">개강일</td>
            <td class="start">3.1</td>
            <td class="end"></td>
          </tr>
        </tbody>
      </table>
    `;

    fetchMock.mockResolvedValue(new Response(htmlCrossYear));

    const events = await getEventsFromSite(2024);

    // Winter break should be in 2025 (next year for academic calendar)
    const winterBreak = events.find(e => e.title === '겨울방학');
    expect(winterBreak!.start.getFullYear()).toBe(2025);

    // Spring semester start should be in 2024
    const springStart = events.find(e => e.title === '개강일');
    expect(springStart!.start.getFullYear()).toBe(2024);
  });

  it('should return empty array on network error', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));

    const events = await getEventsFromSite(2024);

    expect(events).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(3); // Should retry 3 times
  }, 10000); // 10 second timeout

  it('should skip events with missing start date', async () => {
    const htmlMissingDate = `
      <table class="more_year">
        <tbody>
          <tr>
            <td class="more_link">이벤트 무효</td>
            <td class="start"></td>
            <td class="end"></td>
          </tr>
          <tr>
            <td class="more_link">정상 이벤트</td>
            <td class="start">3.1</td>
            <td class="end"></td>
          </tr>
        </tbody>
      </table>
    `;

    fetchMock.mockResolvedValue(new Response(htmlMissingDate));

    const events = await getEventsFromSite(2024);

    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('정상 이벤트');
  });

  it('should handle malformed HTML gracefully', async () => {
    const malformedHtml = '<div>Not a table</div>';

    fetchMock.mockResolvedValue(new Response(malformedHtml));

    const events = await getEventsFromSite(2024);

    expect(events).toEqual([]);
  });

  it('should use retry mechanism on failure', async () => {
    // First two calls fail, third succeeds
    fetchMock
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValue(new Response(mockHtmlResponse));

    const events = await getEventsFromSite(2024);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(events).toHaveLength(2);
  }, 10000); // 10 second timeout
});
