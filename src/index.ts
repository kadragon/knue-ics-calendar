import { ICalCalendar } from "ical-generator";
import { getEventsFromSite } from './parser'; // ❶ 사이트 파싱 로직
import { log } from './utils/logger';

export default {
  async fetch(req: Request, env: Env) {
    try {
      const url = new URL(req.url);
      if (url.pathname.endsWith(".ics")) {
        const ics = await env.KNUE_CAL_KV.get("latest", "text");
        if (!ics) {
          log('warn', 'ICS not available in KV');
          return new Response("Calendar not available yet", { status: 503 });
        }
        // Generate a simple ETag (could use hash function for production)
        const etag = `"${ics.length.toString(16)}"`;

        // Check If-None-Match header
        const ifNoneMatch = req.headers.get('if-none-match');
        if (ifNoneMatch === etag) {
          log('info', 'Returning 304 Not Modified');
          return new Response(null, { status: 304 });
        }

        log('info', 'Serving ICS file');
        return new Response(ics, {
          headers: {
            "content-type": "text/calendar; charset=utf-8",
            "cache-control": "public, max-age=300",
            "content-disposition": 'attachment; filename="events.ics"',
            "etag": etag,
          },
        });
      }
      log('info', 'Path not found', { path: url.pathname });
      return new Response("Not found", { status: 404 });
    } catch (error: any) {
      log('error', 'Error in fetch handler', { error: error.message, stack: error.stack });
      return new Response('Internal server error', { status: 500 });
    }
  },

  // Cron Trigger
  async scheduled(_evt: ScheduledController, env: Env) {
    log('info', "Scheduled function called!");
    try {
      const currentYear = new Date().getFullYear();
      const events = await getEventsFromSite(currentYear);

      if (!events || events.length === 0) {
        log('warn', 'No events parsed from site');
        return; // Do not overwrite existing ICS if no events are found
      }

      const calendar = new ICalCalendar({
        name: "한국교원대학교 학사/행사 일정",
        prodId: "-//Github@kadragon//haksaICS//KO",
        timezone: "Asia/Seoul",
        url: "https://github.com/kadragon/haksaICS",
      });

      events.forEach((event) => {
        calendar.createEvent({
          start: event.start,
          end: event.end,
          summary: event.title,
        });
      });

      const icsString = calendar.toString();
      await env.KNUE_CAL_KV.put("latest", icsString);
      log('info', "ICS generated and saved to KV!");
    } catch (error: any) {
      log('error', 'Error in scheduled function', { error: error.message, stack: error.stack });
      // If an error occurs, the previous valid ICS in KV will be preserved.
    }
  },
};

interface Env {
  KNUE_CAL_KV: KVNamespace;
}