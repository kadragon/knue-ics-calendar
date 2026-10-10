import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { getEventsFromSite } from "../src/parser";
import type { Env, Event } from "../src/types";
import {
	createMockExecutionContext,
	createMockRequest,
	installMockCaches,
	MockKVNamespace,
} from "./helpers/mocks";

vi.mock("../src/parser", () => ({ getEventsFromSite: vi.fn() }));

describe("Academic-year boundary ICS generation", () => {
	let restoreCaches: () => void;

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date("2026-04-05T03:00:00Z"));
		restoreCaches = installMockCaches().restore;
	});

	afterEach(() => {
		restoreCaches();
		vi.useRealTimers();
		vi.resetAllMocks();
	});

	it.each(["missing", "stale"])(
		"includes January and February 2026 when generating in April with %s KV cache",
		async (cacheState) => {
			const january: Event = {
				start: new Date(2026, 0, 15),
				end: new Date(2026, 0, 15),
				title: "January academic event",
			};
			const february: Event = {
				start: new Date(2026, 1, 20),
				end: new Date(2026, 1, 20),
				title: "February academic event",
			};
			const march: Event = {
				start: new Date(2026, 2, 2),
				end: new Date(2026, 2, 2),
				title: "March academic event",
			};
			vi.mocked(getEventsFromSite).mockImplementation(async (year) => {
				if (year === 2026) return [march];
				if (year === 2025) return [february, january];
				throw new Error(`Unexpected academic year: ${year}`);
			});

			const kv = new MockKVNamespace();
			if (cacheState === "stale") {
				await kv.put("latest", "BEGIN:VCALENDAR\r\nEND:VCALENDAR", {
					metadata: { updatedAt: "2026-04-03T03:00:00Z", etag: "stale" },
				});
			}
			const env: Env = { KNUE_CAL_KV: kv as unknown as KVNamespace };
			const response = await worker.fetch(
				createMockRequest(),
				env,
				createMockExecutionContext(),
			);

			expect(response.status).toBe(200);
			expect(getEventsFromSite).toHaveBeenCalledWith(2026);
			expect(getEventsFromSite).toHaveBeenCalledWith(2025);
			expect(getEventsFromSite).toHaveBeenCalledTimes(2);

			const ics = await response.text();
			const events = [
				...ics.matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT/g),
			].map((match) => match[1]);
			expect(events).toHaveLength(3);
			for (const [index, date, title] of [
				[0, "20260115", january.title],
				[1, "20260220", february.title],
				[2, "20260302", march.title],
			] as const) {
				expect(events[index]).toContain(`DTSTART;VALUE=DATE:${date}`);
				expect(events[index]).toContain(`SUMMARY:${title}`);
			}
			expect(await kv.get("latest")).toBe(ics);
		},
	);
});
