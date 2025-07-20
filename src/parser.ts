import axios from "axios";
import * as cheerio from "cheerio";
import { log } from './utils/logger';


interface Event {
  start: Date;
  end: Date;
  title: string;
  url?: string;
}

const HOLIDAYS = [
  "개천절",
  "추석",
  "설날",
  "한글날",
  "성탄절",
  "신정",
  "어린이날",
  "부처님",
  "선거일",
  "광복절",
  "현충일",
  "근로자의",
];

/**
 * 날짜 텍스트를 파싱하여 ISO 형식의 날짜 문자열로 변환합니다.
 * @param {string} dateText - 날짜 텍스트 ('MM.DD' 형식).
 * @param {number} currentYear - 현재 연도.
 * @returns {string} ISO 형식의 날짜 문자열 ('YYYY-MM-DD').
 */
const parseDate = (dateText: string, currentYear: number): string => {
  const [month, day] = dateText
    .match(/\d+/g)!
    .map((num) => num.padStart(2, "0"));
  const year = Number(currentYear) + (Number(month) >= 3 ? 0 : 1); // Adjust year if month is Jan/Feb for academic year
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
    log('info', `Fetching events from ${url}`);
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const events: Event[] = [];

    $("table.more_year tbody tr").each(function () {
      const title = $(this).find(".more_link").text().trim();

      if (title.includes("수업보강") || isHoliday(title)) return;

      const startText = $(this)
        .find(".start")
        .text()
        .replace(/\s+/g, "")
        .trim();
      if (!startText) {
        log('warn', 'Skipping event due to missing start date', { title });
        return;
      }

      let endText = $(this)
        .find(".end")
        .text()
        .replace(/\s+/g, "")
        .replace("-", "")
        .trim();
      if (!endText) endText = startText;

      const startDate = new Date(parseDate(startText, currentYear));
      const endDate = new Date(parseDate(endText, currentYear));

      events.push({ start: startDate, end: endDate, title });
    });
    log('info', `Successfully parsed ${events.length} events`);
    return events;
  } catch (error: any) {
    log('error', "Error parsing academic calendar:", { error: error.message, url });
    return [];
  }
}
