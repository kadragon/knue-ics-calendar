import { getEventsFromSite } from "./parser";
import { log } from "./utils/logger";
import { createCalendarWithEvents } from "./utils/calendar";
import { generateEtag } from "./utils/etag";
import { Env } from "./types";
import { CACHE_CONFIG, CACHE_KEY } from "./constants";

type IcsMetadata = {
  updatedAt?: string;
  etag?: string;
};

const cacheRequest = new Request(CACHE_KEY);

const buildIcsResponse = (
  ics: string,
  etag: string,
  lastModified: string,
): Response =>
  new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "cache-control": `public, max-age=${CACHE_CONFIG.maxAge}`,
      "content-disposition": 'attachment; filename="events.ics"',
      etag,
      "last-modified": lastModified,
    },
  });

export default {
  async fetch(req: Request, env: Env) {
    try {
      const url = new URL(req.url);
      if (url.pathname.endsWith(".ics")) {
        const ifNoneMatch = req.headers.get("if-none-match");
        const cachedResponse = await caches.default.match(cacheRequest);

        if (cachedResponse) {
          const cachedHeaders = new Headers(cachedResponse.headers);
          const cachedEtag = cachedHeaders.get("etag");
          if (cachedEtag && ifNoneMatch === cachedEtag) {
            log("info", "Returning 304 Not Modified (cache hit)");
            const responseHeaders = new Headers({ etag: cachedEtag });
            const cachedLastModified = cachedHeaders.get("last-modified");
            if (cachedLastModified) {
              responseHeaders.set("last-modified", cachedLastModified);
            }
            return new Response(null, { status: 304, headers: responseHeaders });
          }
          log("info", "Serving ICS file from cache");
          return new Response(cachedResponse.body, {
            headers: cachedHeaders,
          });
        }

        const { value: ics, metadata } =
          await env.KNUE_CAL_KV.getWithMetadata<IcsMetadata>("latest", "text");
        if (!ics) {
          log("warn", "ICS not available in KV");
          return new Response("Calendar not available yet", {
            status: 503,
            headers: { "retry-after": "3600" },
          });
        }

        let etag = metadata?.etag;
        if (!etag) {
          etag = await generateEtag(ics);
        }

        const lastModified = metadata?.updatedAt
          ? new Date(metadata.updatedAt).toUTCString()
          : new Date().toUTCString();

        const icsResponse = buildIcsResponse(ics, etag, lastModified);
        await caches.default.put(cacheRequest, icsResponse.clone());

        if (ifNoneMatch === etag) {
          log("info", "Returning 304 Not Modified (KV fallback)");
          const responseHeaders = new Headers({ etag });
          responseHeaders.set("last-modified", lastModified);
          return new Response(null, { status: 304, headers: responseHeaders });
        }

        log("info", "Serving ICS file from KV");

        return icsResponse;
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
      const updatedAt = new Date().toISOString();
      const etag = await generateEtag(icsString);

      await env.KNUE_CAL_KV.put("latest", icsString, {
        metadata: {
          updatedAt,
          etag,
        },
      });

      const cachedResponse = buildIcsResponse(
        icsString,
        etag,
        new Date(updatedAt).toUTCString(),
      );

      await caches.default.put(cacheRequest, cachedResponse);
      log("info", "ICS generated, saved to KV, and cache warmed!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      log("error", "Error in scheduled function", { error: message, stack });
      // If an error occurs, the previous valid ICS in KV will be preserved.
    }
  },
};
