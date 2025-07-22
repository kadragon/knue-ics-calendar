import { ICalCalendar } from "ical-generator";
import { getEventsFromSite } from "./parser";
import { log } from "./utils/logger";

export default {
  async fetch(req: Request, env: Env) {
    try {
      const url = new URL(req.url);
      if (url.pathname.endsWith(".ics")) {
        const ics = await env.KNUE_CAL_KV.get("latest", "text");
        if (!ics) {
          log("warn", "ICS not available in KV");
          return new Response("Calendar not available yet", { status: 503 });
        }
        // Generate a simple ETag (could use hash function for production)
        const etag = `"${ics.length.toString(16)}"`;

        // Check If-None-Match header
        const ifNoneMatch = req.headers.get("if-none-match");
        if (ifNoneMatch === etag) {
          log("info", "Returning 304 Not Modified");
          return new Response(null, { status: 304 });
        }

        log("info", "Serving ICS file");
        return new Response(ics, {
          headers: {
            "content-type": "text/calendar; charset=utf-8",
            "cache-control": "public, max-age=300",
            "content-disposition": 'attachment; filename="events.ics"',
            etag: etag,
          },
        });
      }
      log("info", "Path not found", { path: url.pathname });
      return new Response("Not found", { status: 404 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      log("error", "Error in fetch handler", { error: message, stack });
      return new Response("Internal server error", { status: 500 });
    }
  },

  // Cron Trigger
  async scheduled(_evt: ScheduledController, env: Env) {
    log("info", "Scheduled function called!");
    try {
      const currentYear = new Date().getFullYear();
      const events = await getEventsFromSite(currentYear);

      if (!events || events.length === 0) {
        log("warn", "No events parsed from site");
        return; // Do not overwrite existing ICS if no events are found
      }

      const calendar = new ICalCalendar({
        name: "한국교원대학교 학사 일정",
        prodId: "-//Github@kadragon//haksaICS//KO",
        timezone: "Asia/Seoul",
        url: "https://github.com/kadragon/knue-ics-calendar",
      });

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

      const icsString = calendar.toString();
      await env.KNUE_CAL_KV.put("latest", icsString);
      log("info", "ICS generated and saved to KV!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      log("error", "Error in scheduled function", { error: message, stack });
      // If an error occurs, the previous valid ICS in KV will be preserved.
    }
  },
};

interface Env {
  KNUE_CAL_KV: KVNamespace;
}
