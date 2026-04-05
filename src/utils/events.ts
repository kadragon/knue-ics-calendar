import type { Event } from "../types";

/**
 * title + start + end 기준으로 중복 이벤트를 제거.
 */
export function deduplicateEvents(events: Event[]): Event[] {
	const seen = new Set<string>();
	return events.filter((event) => {
		const key = `${event.title}|${event.start.getTime()}|${event.end.getTime()}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
