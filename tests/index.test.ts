import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
		it("should generate ICS on-demand when not in KV", async () => {
			const request = createMockRequest("https://example.com/calendar.ics");

			const response = await worker.fetch(request, env);

			expect(response.status).toBe(200);
			expect(response.headers.get("content-type")).toBe(
				"text/calendar; charset=utf-8",
			);
			const ics = await response.text();
			expect(ics).toContain("BEGIN:VCALENDAR");
			expect(ics).toContain("개강일");
		});

		it("should return ICS file when available", async () => {
			const icsContent = "BEGIN:VCALENDAR\nEND:VCALENDAR";
			const now = new Date();
			const metadata = {
				updatedAt: now.toISOString(),
				etag: "test-etag",
			};
			await kvStore.put("latest", icsContent, { metadata });

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

	describe("on-demand cache behavior", () => {
		it("should serve cached ICS when within 24 hours", async () => {
			const icsContent = "BEGIN:VCALENDAR\n개강일\nEND:VCALENDAR";
			const now = new Date();
			const metadata = {
				updatedAt: now.toISOString(),
				etag: "test-etag-123",
			};

			await kvStore.put("latest", icsContent, { metadata });

			const request = createMockRequest("https://example.com/calendar.ics");
			const response = await worker.fetch(request, env);

			expect(response.status).toBe(200);
			expect(await response.text()).toBe(icsContent);
			expect(response.headers.get("etag")).toBe("test-etag-123");
		});

		it("should regenerate ICS when cache is older than 24 hours", async () => {
			const oldIcs = "BEGIN:VCALENDAR\n이전\nEND:VCALENDAR";
			const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago

			const metadata = {
				updatedAt: oldDate.toISOString(),
				etag: "old-etag",
			};

			await kvStore.put("latest", oldIcs, { metadata });

			const request = createMockRequest("https://example.com/calendar.ics");
			const response = await worker.fetch(request, env);

			expect(response.status).toBe(200);
			const ics = await response.text();
			expect(ics).toContain("BEGIN:VCALENDAR");
			expect(ics).toContain("개강일"); // New events, not old ones
		});

		it("should use stale cache as fallback when generation fails", async () => {
			const staleIcs = "BEGIN:VCALENDAR\nstale\nEND:VCALENDAR";
			const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000);

			const metadata = {
				updatedAt: oldDate.toISOString(),
				etag: "stale-etag",
			};

			await kvStore.put("latest", staleIcs, { metadata });

			// Mock parser to fail
			const { getEventsFromSite } = await import("../src/parser.js");
			vi.mocked(getEventsFromSite).mockRejectedValueOnce(
				new Error("Parser error"),
			);

			const request = createMockRequest("https://example.com/calendar.ics");
			const response = await worker.fetch(request, env);

			// Should serve stale cache instead of failing
			expect(response.status).toBe(200);
			expect(await response.text()).toBe(staleIcs);
		});

		it("should return 503 when no cache and generation fails", async () => {
			// Mock parser to fail
			const { getEventsFromSite } = await import("../src/parser.js");
			vi.mocked(getEventsFromSite).mockRejectedValueOnce(
				new Error("Parser error"),
			);

			const request = createMockRequest("https://example.com/calendar.ics");
			const response = await worker.fetch(request, env);

			expect(response.status).toBe(503);
			expect(await response.text()).toBe("Calendar not available yet");
		});
	});
});
