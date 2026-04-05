import { describe, expect, it } from "vitest";
import type { Event } from "../../src/types";
import { deduplicateEvents } from "../../src/utils/events";

describe("deduplicateEvents", () => {
	it("should remove duplicate events with same title, start, and end", () => {
		const events: Event[] = [
			{
				title: "개강일",
				start: new Date("2026-03-01"),
				end: new Date("2026-03-01"),
			},
			{
				title: "개강일",
				start: new Date("2026-03-01"),
				end: new Date("2026-03-01"),
			},
		];

		const result = deduplicateEvents(events);
		expect(result).toHaveLength(1);
		expect(result[0].title).toBe("개강일");
	});

	it("should keep events with different titles", () => {
		const events: Event[] = [
			{
				title: "개강일",
				start: new Date("2026-03-01"),
				end: new Date("2026-03-01"),
			},
			{
				title: "종강일",
				start: new Date("2026-03-01"),
				end: new Date("2026-03-01"),
			},
		];

		const result = deduplicateEvents(events);
		expect(result).toHaveLength(2);
	});

	it("should keep events with different dates but same title", () => {
		const events: Event[] = [
			{
				title: "회의",
				start: new Date("2026-03-01"),
				end: new Date("2026-03-01"),
			},
			{
				title: "회의",
				start: new Date("2026-04-01"),
				end: new Date("2026-04-01"),
			},
		];

		const result = deduplicateEvents(events);
		expect(result).toHaveLength(2);
	});

	it("should preserve order of first occurrence", () => {
		const events: Event[] = [
			{
				title: "A",
				start: new Date("2026-01-01"),
				end: new Date("2026-01-01"),
			},
			{
				title: "B",
				start: new Date("2026-02-01"),
				end: new Date("2026-02-01"),
			},
			{
				title: "A",
				start: new Date("2026-01-01"),
				end: new Date("2026-01-01"),
			},
		];

		const result = deduplicateEvents(events);
		expect(result).toHaveLength(2);
		expect(result[0].title).toBe("A");
		expect(result[1].title).toBe("B");
	});

	it("should return empty array for empty input", () => {
		expect(deduplicateEvents([])).toEqual([]);
	});
});
