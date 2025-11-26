import { describe, expect, it } from "vitest";
import { createCalendarWithEvents } from "../../src/utils/calendar";
import { mockEvents, mockLongEvent } from "../helpers/mocks";

describe("Calendar Utility", () => {
	it("should create calendar with basic events", () => {
		const calendar = createCalendarWithEvents(mockEvents);

		expect(calendar.name()).toBe("한국교원대학교 학사 일정");
		expect(calendar.timezone()).toBe("Asia/Seoul");

		const events = calendar.events();
		// mockEvents has 3 events, but one gets split because it's >3 days (기말고사 기간)
		expect(events).toHaveLength(4); // 개강일(1) + 중간고사(1) + 기말고사 기간 split(2)
	});

	it("should create single event for short duration events", () => {
		const shortEvent = mockEvents[0]; // Single day event
		const calendar = createCalendarWithEvents([shortEvent]);

		const events = calendar.events();
		expect(events).toHaveLength(1);

		const event = events[0];
		expect(event.summary()).toBe("개강일");
		expect(event.allDay()).toBe(true);
	});

	it("should split long duration events into start and end events", () => {
		const calendar = createCalendarWithEvents([mockLongEvent]);

		const events = calendar.events();
		expect(events).toHaveLength(2); // Split into start and end events

		const startEvent = events[0];
		const endEvent = events[1];

		expect(startEvent.summary()).toBe("여름방학 시작 (~8. 30.)");
		expect(endEvent.summary()).toBe("여름방학 종료 (6. 20.~)");

		// Both should be all-day events
		expect(startEvent.allDay()).toBe(true);
		expect(endEvent.allDay()).toBe(true);
	});

	it("should handle events with exactly 3 days duration", () => {
		const threeDayEvent = {
			start: new Date("2024-06-01"),
			end: new Date("2024-06-03"),
			title: "3일 이벤트",
		};

		const calendar = createCalendarWithEvents([threeDayEvent]);
		const events = calendar.events();

		// 3 days or less should be single event
		expect(events).toHaveLength(1);
		expect(events[0].summary()).toBe("3일 이벤트");
	});

	it("should handle events with more than 3 days duration", () => {
		const fourDayEvent = {
			start: new Date("2024-06-01"),
			end: new Date("2024-06-05"),
			title: "4일 이벤트",
		};

		const calendar = createCalendarWithEvents([fourDayEvent]);
		const events = calendar.events();

		// More than 3 days should be split
		expect(events).toHaveLength(2);
	});

	it("should handle empty events array", () => {
		const calendar = createCalendarWithEvents([]);

		expect(calendar.events()).toHaveLength(0);
		expect(calendar.name()).toBe("한국교원대학교 학사 일정");
	});

	it("should format end date correctly in start event summary", () => {
		const testEvent = {
			start: new Date("2024-03-01"),
			end: new Date("2024-08-15"),
			title: "테스트 기간",
		};

		const calendar = createCalendarWithEvents([testEvent]);
		const events = calendar.events();

		const startEvent = events[0];
		expect(startEvent.summary()).toBe("테스트 기간 시작 (~8. 15.)");

		const endEvent = events[1];
		expect(endEvent.summary()).toBe("테스트 기간 종료 (3. 1.~)");
	});
});
