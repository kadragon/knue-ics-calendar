import { ICalCalendar } from "ical-generator";
import { Event } from "../types";
import { CALENDAR_CONFIG } from "../constants";

/**
 * Creates an iCal calendar with event processing logic
 */
export function createCalendarWithEvents(events: Event[]): ICalCalendar {
  const calendar = new ICalCalendar(CALENDAR_CONFIG);

  events.forEach((event) => {
    const diffTime = Math.abs(event.end.getTime() - event.start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 3) {
      // Create start event
      calendar.createEvent({
        start: event.start,
        end: event.start, // Event ends on the same day
        summary: `${event.title} (~${event.end.getMonth() + 1}. ${event.end
          .getDate()
          .toString()}.)`,
        allDay: true,
      });

      // Create end event
      calendar.createEvent({
        start: event.end,
        end: event.end, // Event ends on the same day
        summary: event.title,
        allDay: true,
      });
    } else {
      calendar.createEvent({
        start: event.start,
        end: event.end,
        summary: event.title,
        allDay: true,
      });
    }
  });

  return calendar;
}