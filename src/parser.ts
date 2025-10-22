import { log } from "./utils/logger";
import { Event } from "./types";
import { HOLIDAYS, REQUEST_CONFIG } from "./constants";

/**
 * 날짜 텍스트를 파싱하여 ISO 형식의 날짜 문자열로 변환합니다.
 * @param {string} dateText - 날짜 텍스트 ('MM.DD' 형식).
 * @param {number} currentYear - 현재 연도.
 * @returns {string | null} ISO 형식의 날짜 문자열 ('YYYY-MM-DD') 또는 파싱 실패 시 null.
 */
const parseDate = (dateText: string, currentYear: number): string | null => {
  const dateParts = dateText.match(/\d{1,2}/g);
  if (!dateParts || dateParts.length < 2) {
    log("warn", "Could not parse date from text", { dateText });
    return null;
  }
  const [month, day] = dateParts.map((num) => num.padStart(2, "0"));
  const year = Number(currentYear) + (Number(month) >= 3 ? 0 : 1);
  return `${year}-${month}-${day}`;
};

/**
 * 이벤트가 공휴일인지 확인합니다.
 * @param {string} title - 이벤트 제목.
 * @returns {boolean} 공휴일 여부.
 */
const isHoliday = (title: string): boolean =>
  HOLIDAYS.some((holiday) => title.includes(holiday));

/**
 * 주어진 연도에 대한 학사 일정을 파싱합니다.
 * @param {number} currentYear - 파싱할 연도.
 * @returns {Promise<Event[]>} 학사 일정을 담은 객체 배열.
 */
export async function getEventsFromSite(currentYear: number): Promise<Event[]> {
  const url = `https://www.knue.ac.kr/www/selectSchdleWebList.do?key=542&searchY=${currentYear}&searchM=3`; // Start from March for academic year

  try {
    log("info", `Fetching events from ${url}`);
    const res = await fetch(url, {
      headers: {
        "User-Agent": REQUEST_CONFIG.userAgent,
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }

    const html = await res.text();

    const events: Event[] = [];
    // Find all tables in the page (updated to handle tables without class attribute)
    const tableMatches = html.match(/<table[^>]*>([\s\S]*?)<\/table>/g);
    if (!tableMatches || tableMatches.length === 0) {
      log("warn", "No events table found");
      return events;
    }

    const allRows: string[] = [];
    for (const table of tableMatches) {
      const tbodyMatch = table.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
      if (tbodyMatch) {
        const rows = tbodyMatch[1].match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
        allRows.push(...rows);
      }
    }

    for (const row of allRows) {
      // Extract date range from first <td> (e.g., "02 . 28 - 03 . 01")
      const tds = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
      if (tds.length < 2) continue;

      // First column contains the date range
      const dateRangeTd = tds[0];
      if (!dateRangeTd) continue;

      const dateRangeMatch = dateRangeTd.match(/<td[^>]*>([\s\S]*?)<\/td>/);
      if (!dateRangeMatch) continue;

      const dateRangeText = dateRangeMatch[1]
        .replace(/&nbsp;/g, " ") // Convert HTML spaces
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .trim();

      // Second column contains the event title (often within a link)
      const titleTd = tds[1];
      if (!titleTd) continue;

      const titleMatch = titleTd.match(/(?:<a[^>]*>)?([\s\S]*?)(?:<\/a>)?<\/td>/);
      let title = titleMatch ? titleMatch[1].trim() : "";

      // Clean up title for ICS compatibility
      title = title.replace(/&nbsp;/g, " ");
      title = title.replace(/<[^>]*>/g, ""); // Remove any remaining HTML tags
      title = title.replace(/[,]/g, " ");
      title = title.replace(/\s+/g, " ");
      title = title.trim();

      if (title.length > 45) {
        title = title.substring(0, 42) + "...";
      }

      if (!title || title.includes("수업보강") || isHoliday(title)) continue;

      // Parse date range (e.g., "02 . 28 - 03 . 01" or "03 . 01")
      const dates = dateRangeText.split("-").map((d) => d.trim());
      if (dates.length === 0) {
        log("warn", "Skipping event due to missing date", { title });
        continue;
      }

      // Convert "02 . 28" format to "02.28"
      const normalizeDate = (dateStr: string): string => {
        return dateStr.replace(/\s+\.\s+/g, ".");
      };

      const startText = normalizeDate(dates[0]);
      const endText = dates.length > 1 ? normalizeDate(dates[1]) : startText;

      const startIso = parseDate(startText, currentYear);
      if (!startIso) continue;

      let endIso = parseDate(endText, currentYear);
      if (!endIso) endIso = startIso;

      const startDate = new Date(startIso);
      const endDate = new Date(endIso);

      events.push({ start: startDate, end: endDate, title });
    }

    log("info", `Successfully parsed ${events.length} events`);
    return events;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    log("error", "Error parsing academic calendar:", {
      error: message,
      url,
    });
    return [];
  }
}

