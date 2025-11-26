import { beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import type { Env } from "../src/types";
import {
	createMockRequest,
	installMockCaches,
	MockKVNamespace,
} from "./helpers/mocks";

// Mock the parser module
vi.mock("../src/parser", () => ({
	getEventsFromSite: vi.fn().mockResolvedValue([
		{
			start: new Date("2024-03-01"),
			end: new Date("2024-03-01"),
			title: "개강일",
		},
		{
			start: new Date("2024-06-01"),
			end: new Date("2024-08-31"),
			title: "여름방학",
		},
	]),
}));

describe("Main Worker Handler", () => {
	let kvStore: MockKVNamespace;
	let env: Env;
	let cacheRestore: { restore(): void };

	beforeEach(() => {
		kvStore = new MockKVNamespace();
		env = { KNUE_CAL_KV: kvStore as unknown as KVNamespace };
		cacheRestore = installMockCaches();
		vi.clearAllMocks();
	});

	afterEach(() => {
		cacheRestore.restore();
	});

	describe("fetch handler", () => {
		it("should return 503 when ICS not available in KV", async () => {
			const request = createMockRequest("https://example.com/calendar.ics");

			const response = await worker.fetch(request, env);

			expect(response.status).toBe(503);
			expect(await response.text()).toBe("Calendar not available yet");
		});

		it("should return ICS file when available", async () => {
			const icsContent = "BEGIN:VCALENDAR\nEND:VCALENDAR";
			await kvStore.put("latest", icsContent);

			const request = createMockRequest("https://example.com/calendar.ics");
			const response = await worker.fetch(request, env);

			expect(response.status).toBe(200);
			expect(await response.text()).toBe(icsContent);
			expect(response.headers.get("content-type")).toBe(
				"text/calendar; charset=utf-8",
			);
			expect(response.headers.get("etag")).toBeTruthy();
		});

		it("should return 304 for matching ETag", async () => {
			const icsContent = "BEGIN:VCALENDAR\nEND:VCALENDAR";
			await kvStore.put("latest", icsContent);

			// First request to get ETag
			const firstRequest = createMockRequest(
				"https://example.com/calendar.ics",
			);
			const firstResponse = await worker.fetch(firstRequest, env);
			const etag = firstResponse.headers.get("etag");
			expect(etag).toBeTruthy();

			// Second request with If-None-Match
			const secondRequest = createMockRequest(
				"https://example.com/calendar.ics",
				{
					"if-none-match": etag ?? "",
				},
			);
			const secondResponse = await worker.fetch(secondRequest, env);

			expect(secondResponse.status).toBe(304);
		});

		it("should serve ICS without compression", async () => {
			const icsContent = "BEGIN:VCALENDAR\nEND:VCALENDAR";
			await kvStore.put("latest", icsContent);

			const request = createMockRequest("https://example.com/calendar.ics", {
				"accept-encoding": "gzip, deflate",
			});

			const response = await worker.fetch(request, env);

			expect(response.status).toBe(200);
			expect(response.headers.get("content-encoding")).toBeNull();
			expect(response.headers.get("content-type")).toBe(
				"text/calendar; charset=utf-8",
			);
		});

		it("should return 404 for non-ICS paths", async () => {
			const request = createMockRequest("https://example.com/other-path");

			const response = await worker.fetch(request, env);

			expect(response.status).toBe(404);
			expect(await response.text()).toBe("Not found");
		});

		it("should handle errors gracefully", async () => {
			// Mock KV to throw error
			const errorEnv = {
				KNUE_CAL_KV: {
					get: vi.fn().mockRejectedValue(new Error("KV Error")),
					put: vi.fn(),
					delete: vi.fn(),
					list: vi.fn(),
					getWithMetadata: vi.fn(),
				},
			} as Env;

			const request = createMockRequest("https://example.com/calendar.ics");
			const response = await worker.fetch(request, errorEnv);

			expect(response.status).toBe(500);
			expect(await response.text()).toBe("Internal server error");
		});

		it("should handle non-Error exceptions gracefully", async () => {
			// Mock KV to throw non-Error
			const errorEnv = {
				KNUE_CAL_KV: {
					get: vi.fn().mockRejectedValue("String error"),
					put: vi.fn(),
					delete: vi.fn(),
					list: vi.fn(),
					getWithMetadata: vi.fn(),
				},
			} as Env;

			const request = createMockRequest("https://example.com/calendar.ics");
			const response = await worker.fetch(request, errorEnv);

			expect(response.status).toBe(500);
			expect(await response.text()).toBe("Internal server error");
		});
	});

	describe("scheduled handler", () => {
		it("should generate and store ICS when events are available", async () => {
			const mockController = {} as ScheduledController;

			await worker.scheduled(mockController, env);

			const storedIcs = await kvStore.get("latest");
			expect(storedIcs).toBeTruthy();
			expect(storedIcs).toContain("BEGIN:VCALENDAR");
			expect(storedIcs).toContain("개강일");
		});

		it("should not overwrite existing ICS when no events found", async () => {
			// Pre-populate KV with existing ICS
			const existingIcs = "EXISTING:CALENDAR";
			await kvStore.put("latest", existingIcs);

			// Mock parser to return empty events
			const { getEventsFromSite } = await import("../src/parser.js");
			vi.mocked(getEventsFromSite).mockResolvedValueOnce([]);

			const mockController = {} as ScheduledController;
			await worker.scheduled(mockController, env);

			const storedIcs = await kvStore.get("latest");
			expect(storedIcs).toBe(existingIcs); // Should remain unchanged
		});

		it("should handle parser errors gracefully", async () => {
			// Mock parser to throw error
			const { getEventsFromSite } = await import("../src/parser.js");
			vi.mocked(getEventsFromSite).mockRejectedValueOnce(
				new Error("Parser error"),
			);

			const mockController = {} as ScheduledController;

			// Should not throw
			await expect(
				worker.scheduled(mockController, env),
			).resolves.toBeUndefined();
		});

		it("should handle non-Error parser exceptions gracefully", async () => {
			// Mock parser to throw non-Error
			const { getEventsFromSite } = await import("../src/parser.js");
			vi.mocked(getEventsFromSite).mockRejectedValueOnce("String parser error");

			const mockController = {} as ScheduledController;

			// Should not throw
			await expect(
				worker.scheduled(mockController, env),
			).resolves.toBeUndefined();
		});

		it("should create calendar with correct metadata", async () => {
			const mockController = {} as ScheduledController;

			await worker.scheduled(mockController, env);

			const storedIcs = await kvStore.get("latest");
			expect(storedIcs).toContain(
				"PRODID:--//Github@kadragon//knue-ics-calendar//KO",
			);
			expect(storedIcs).toContain("X-WR-CALNAME:한국교원대학교 학사 일정");
			expect(storedIcs).toContain("BEGIN:VCALENDAR");
			expect(storedIcs).toContain("END:VCALENDAR");
		});

		it("should handle long events by splitting them", async () => {
			const mockController = {} as ScheduledController;

			await worker.scheduled(mockController, env);

			const storedIcs = await kvStore.get("latest");
			// Should contain both start and end events for 여름방학
			expect(storedIcs).toContain("여름방학");
			// Should see multiple events (split long event + regular event)
			const eventCount = (storedIcs?.match(/BEGIN:VEVENT/g) || []).length;
			expect(eventCount).toBeGreaterThan(2); // At least 3 events (개강일 + 여름방학 start + 여름방학 end)
		});
	});
});
