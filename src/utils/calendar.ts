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
      const startEventEnd = new Date(event.start);
      startEventEnd.setDate(startEventEnd.getDate() + 1);
      
      calendar.createEvent({
        start: event.start,
        end: startEventEnd,
        summary: `${event.title} 시작 (~${event.end.getMonth() + 1}. ${event.end
          .getDate()
          .toString()}.)`,
        allDay: true,
      });

      // Create end event
      const endEventEnd = new Date(event.end);
      endEventEnd.setDate(endEventEnd.getDate() + 1);
      
      calendar.createEvent({
        start: event.end,
        end: endEventEnd,
        summary: `${event.title} 종료 (${event.start.getMonth() + 1}. ${event.start
          .getDate()
          .toString()}.~)`,
        allDay: true,
      });
    } else {
      // For all-day events, end date should be the day after
      const eventEnd = new Date(event.end);
      eventEnd.setDate(eventEnd.getDate() + 1);
      
      calendar.createEvent({
        start: event.start,
        end: eventEnd,
        summary: event.title,
        allDay: true,
      });
    }
  });

  return calendar;
}