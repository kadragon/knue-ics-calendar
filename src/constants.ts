export const HOLIDAYS = [
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

export const CALENDAR_CONFIG = {
	name: "한국교원대학교 학사 일정",
	prodId: "-//Github@kadragon//knue-ics-calendar//KO",
	timezone: "Asia/Seoul",
	url: "https://github.com/kadragon/knue-ics-calendar",
} as const;

export const REQUEST_CONFIG = {
	timeout: 10000, // 10 seconds
	userAgent: "KNUE-ICS-Calendar/1.0.0",
	maxRetries: 3,
	retryDelayMs: 2000,
} as const;

export const CACHE_CONFIG = {
	maxAge: 60 * 60 * 24, // 1 day (HTTP cache)
	kvTtl: 60 * 60 * 24, // 1 day (KV TTL for on-demand generation)
} as const;

export const CACHE_KEY = "https://knue-ics-cache/events.ics";

export const PARSER_CONFIG = {
	excludedTableSelector: ".knue_calendar",
} as const;
