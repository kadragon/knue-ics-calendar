import { describe, expect, it } from "vitest";
import {
	CACHE_CONFIG,
	CALENDAR_CONFIG,
	HOLIDAYS,
	REQUEST_CONFIG,
} from "../src/constants";

describe("Constants", () => {
	describe("HOLIDAYS", () => {
		it("should contain expected Korean holidays", () => {
			expect(HOLIDAYS).toContain("개천절");
			expect(HOLIDAYS).toContain("추석");
			expect(HOLIDAYS).toContain("설날");
			expect(HOLIDAYS).toContain("한글날");
			expect(HOLIDAYS).toContain("성탄절");
			expect(HOLIDAYS).toContain("어린이날");
		});

		it("should be an array of strings", () => {
			expect(Array.isArray(HOLIDAYS)).toBe(true);
			HOLIDAYS.forEach((holiday) => {
				expect(typeof holiday).toBe("string");
			});
		});
	});

	describe("CALENDAR_CONFIG", () => {
		it("should have correct calendar configuration", () => {
			expect(CALENDAR_CONFIG.name).toBe("한국교원대학교 학사 일정");
			expect(CALENDAR_CONFIG.prodId).toBe(
				"-//Github@kadragon//knue-ics-calendar//KO",
			);
			expect(CALENDAR_CONFIG.timezone).toBe("Asia/Seoul");
			expect(CALENDAR_CONFIG.url).toBe(
				"https://github.com/kadragon/knue-ics-calendar",
			);
		});

		it("should be readonly (TypeScript compile-time check)", () => {
			// This is a compile-time check, so we just verify the object exists
			expect(CALENDAR_CONFIG).toBeDefined();
			expect(typeof CALENDAR_CONFIG).toBe("object");
		});
	});

	describe("REQUEST_CONFIG", () => {
		it("should have reasonable timeout values", () => {
			expect(REQUEST_CONFIG.timeout).toBe(10000); // 10 seconds
			expect(REQUEST_CONFIG.maxRetries).toBe(3);
			expect(REQUEST_CONFIG.retryDelayMs).toBe(2000); // 2 seconds
		});

		it("should have proper user agent", () => {
			expect(REQUEST_CONFIG.userAgent).toBe("KNUE-ICS-Calendar/1.0.0");
		});
	});

	describe("CACHE_CONFIG", () => {
		it("should have reasonable cache duration", () => {
			expect(CACHE_CONFIG.maxAge).toBe(60 * 60 * 24); // 1 day in seconds
			expect(typeof CACHE_CONFIG.maxAge).toBe("number");
		});
	});
});
