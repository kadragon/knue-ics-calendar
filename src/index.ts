import { getEventsFromSite } from "./parser";
import { log } from "./utils/logger";
import { createCalendarWithEvents } from "./utils/calendar";
import { generateEtag } from "./utils/etag";
import { Env } from "./types";
import { CACHE_CONFIG } from "./constants";

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
        // Generate content-based ETag using hash
        const etag = await generateEtag(ics);

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
            "cache-control": `public, max-age=${CACHE_CONFIG.maxAge}`,
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

      const calendar = createCalendarWithEvents(events);

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

