import axios from "axios";
import * as cheerio from "cheerio";
import { log } from "./utils/logger";
import { withRetry } from "./utils/retry";
import { Event } from "./types";
import { HOLIDAYS, REQUEST_CONFIG } from "./constants";

/**
 * 날짜 텍스트를 파싱하여 ISO 형식의 날짜 문자열로 변환합니다.
 * @param {string} dateText - 날짜 텍스트 ('MM.DD' 형식).
 * @param {number} currentYear - 현재 연도.
 * @returns {string | null} ISO 형식의 날짜 문자열 ('YYYY-MM-DD') 또는 파싱 실패 시 null.
 */
const parseDate = (dateText: string, currentYear: number): string | null => {
  const dateParts = dateText.match(/\d{1,2}/g); // 최대 두 자리 숫자만 매칭
  if (!dateParts || dateParts.length < 2) {
    log("warn", "Could not parse date from text", { dateText });
    return null;
  }
  const [month, day] = dateParts.map((num) => num.padStart(2, "0"));
  const year = Number(currentYear) + (Number(month) >= 3 ? 0 : 1); // 학사연도 기준 3월 이전이면 다음 해
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
  // Use mock data in development mode

  const url = `https://www.knue.ac.kr/www/selectSchdleWebList.do?key=542&searchY=${currentYear}&searchM=3`; // Start from March for academic year

  try {
    log("info", `Fetching events from ${url}`);
    const { data } = await withRetry(
      () =>
        axios.get(url, {
          timeout: REQUEST_CONFIG.timeout,
          headers: {
            "User-Agent": REQUEST_CONFIG.userAgent,
          },
        }),
      {
        maxRetries: REQUEST_CONFIG.maxRetries,
        delayMs: REQUEST_CONFIG.retryDelayMs,
      }
    );
    const $ = cheerio.load(data);
    const events: Event[] = [];

    $("table.more_year tbody tr").each(function () {
      let title = $(this).find(".more_link").text().trim();

      // Clean up title for ICS compatibility
      title = title.replace(/[,]/g, " "); // Replace commas with spaces
      title = title.replace(/\s+/g, " "); // Replace multiple spaces with single space
      title = title.replace(/학년도 /g, "-"); // Shorten academic year
      title = title.trim();

      // Truncate title if still too long (ICS apps may have issues with long titles)
      if (title.length > 45) {
        title = title.substring(0, 42) + "...";
      }

      if (title.includes("수업보강") || isHoliday(title)) return;

      const startText = $(this)
        .find(".start")
        .text()
        .replace(/\s+/g, "")
        .trim();
      if (!startText) {
        log("warn", "Skipping event due to missing start date", { title });
        return;
      }

      let endText = $(this)
        .find(".end")
        .text()
        .replace(/\s+/g, "")
        .replace("-", "")
        .trim();
      if (!endText) endText = startText;

      const startIso = parseDate(startText, currentYear);
      if (!startIso) {
        // 날짜 파싱 실패 시 해당 이벤트 건너뜀
        return;
      }

      let endIso = parseDate(endText, currentYear);
      if (!endIso) {
        endIso = startIso; // 종료일이 없거나 파싱 실패 시 시작일과 동일하게 설정
      }

      const startDate = new Date(startIso);
      const endDate = new Date(endIso);

      events.push({ start: startDate, end: endDate, title });
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
