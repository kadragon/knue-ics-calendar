import { log } from "./utils/logger";
import { Event } from "./types";
import { HOLIDAYS, REQUEST_CONFIG, PARSER_CONFIG } from "./constants";
import * as cheerio from "cheerio";

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
    const $ = cheerio.load(html);

    // Find all tables in the page (exclude calendar UI table)
    const tables = $("table").not(PARSER_CONFIG.excludedTableSelector);
    if (tables.length === 0) {
      log("warn", "No events table found");
      return events;
    }

    // Iterate through all tables and extract rows
    tables.each((_tableIndex, tableElement) => {
      const $table = $(tableElement);
      const rows = $table.find("tbody tr");

      rows.each((_rowIndex, rowElement) => {
        const $row = $(rowElement);
        const $tds = $row.find("td");

        if ($tds.length < 2) return; // continue to next row

        // Extract date range from first column (e.g., "02 . 28 - 03 . 01")
        const dateRangeText = $tds.eq(0).text().trim();
        if (!dateRangeText) {
          return; // continue to next row
        }

        // Extract event title from second column (safely handles links, badges, icons, etc.)
        let title = $tds.eq(1).text().trim();

        // Clean up title for ICS compatibility
        title = title.replace(/[,]/g, " ")  // Replace commas with spaces
                     .replace(/\s+/g, " ") // Collapse whitespace
                     .trim();              // Remove leading/trailing whitespace

        if (title.length > 45) {
          title = title.substring(0, 42) + "...";
        }

        if (!title || title.includes("수업보강") || isHoliday(title)) {
          return; // continue to next row
        }

        // Parse date range (e.g., "02 . 28 - 03 . 01" or "03 . 01")
        const dates = dateRangeText.split("-").map((d) => d.trim());
        if (dates.length === 0) {
          log("warn", "Skipping event due to missing date", { title });
          return; // continue to next row
        }

        // Convert "02 . 28" format to "02.28"
        const normalizeDate = (dateStr: string): string => {
          return dateStr.replace(/\s+\.\s+/g, ".");
        };

        const startText = normalizeDate(dates[0]);
        const endText = dates.length > 1 ? normalizeDate(dates[1]) : startText;

        const startIso = parseDate(startText, currentYear);
        if (!startIso) return; // continue to next row

        let endIso = parseDate(endText, currentYear);
        if (!endIso) endIso = startIso;

        const startDate = new Date(startIso);
        const endDate = new Date(endIso);

        events.push({ start: startDate, end: endDate, title });
      });
    });

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

