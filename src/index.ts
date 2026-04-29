import { CACHE_CONFIG, CACHE_KEY } from "./constants";
import { updateGist } from "./gist";
import { getEventsFromSite } from "./parser";
import type { Env } from "./types";
import { getAcademicYearsToFetch } from "./utils/academic-year";
import { createCalendarWithEvents } from "./utils/calendar";
import { generateEtag } from "./utils/etag";
import { deduplicateEvents } from "./utils/events";
import { log } from "./utils/logger";

type IcsMetadata = {
	updatedAt?: string;
	etag?: string;
	eventsHash?: string;
};

const cacheRequest = new Request(CACHE_KEY);

const buildIcsResponse = (
	ics: string,
	etag: string,
	lastModified: string,
	isStale = false,
): Response => {
	// If serving stale data, use a much shorter cache duration
	const maxAge = isStale ? 60 : CACHE_CONFIG.maxAge;
	return new Response(ics, {
		headers: {
			"content-type": "text/calendar; charset=utf-8",
			"cache-control": `public, max-age=${maxAge}`,
			"content-disposition": 'attachment; filename="events.ics"',
			etag,
			"last-modified": lastModified,
		},
	});
};

/**
 * Check if ICS cache is still valid (within 24 hours)
 */
const isCacheValid = (updatedAt: string | undefined): boolean => {
	if (!updatedAt) return false;
	const cacheTime = new Date(updatedAt).getTime();
	const now = Date.now();
	const ageMs = now - cacheTime;
	const maxAgeMs = CACHE_CONFIG.kvTtl * 1000;
	return ageMs < maxAgeMs;
};

/**
 * Extract ICS data from KV cache with metadata
 */
const extractKvData = async (
	kvIcs: string,
	kvMetadata: IcsMetadata | null,
): Promise<{ ics: string; etag: string; updatedAt: string }> => {
	const ics = kvIcs;
	const etag = kvMetadata?.etag || (await generateEtag(kvIcs));
	const updatedAt = kvMetadata?.updatedAt || new Date().toISOString();
	return { ics, etag, updatedAt };
};

/**
 * Generate ICS from site and save to KV
 */
const generateAndSaveIcs = async (
	env: Env,
	previousEventsHash?: string,
): Promise<{
	ics: string;
	etag: string;
	updatedAt: string;
	changed: boolean;
}> => {
	log("info", "Generating ICS on-demand");
	const [current, previous] = getAcademicYearsToFetch(new Date());
	const [currentEvents, prevEvents] = await Promise.all([
		getEventsFromSite(current),
		getEventsFromSite(previous),
	]);
	const events = deduplicateEvents([...prevEvents, ...currentEvents]).sort(
		(a, b) => a.start.getTime() - b.start.getTime(),
	);

	if (!events || events.length === 0) {
		log("error", "No events parsed from site");
		throw new Error("No events found from site");
	}

	const eventsFingerprint = events
		.map((e) => `${e.title}|${e.start.toISOString()}|${e.end.toISOString()}`)
		.join("\n");
	const eventsHash = await generateEtag(eventsFingerprint);
	const changed = eventsHash !== previousEventsHash;

	const calendar = createCalendarWithEvents(events);
	const icsString = calendar.toString();
	const updatedAt = new Date().toISOString();
	const etag = await generateEtag(icsString);

	// Save to KV with metadata
	await env.KNUE_CAL_KV.put("latest", icsString, {
		metadata: {
			updatedAt,
			etag,
			eventsHash,
		},
	});

	log("info", "ICS generated and saved to KV");
	return { ics: icsString, etag, updatedAt, changed };
};

export default {
	async fetch(req: Request, env: Env, ctx: ExecutionContext) {
		try {
			const url = new URL(req.url);
			if (url.pathname.endsWith(".ics")) {
				const ifNoneMatch = req.headers.get("if-none-match");

				// 1. Check HTTP cache first
				const cachedResponse = await caches.default.match(cacheRequest);
				if (cachedResponse) {
					const cachedHeaders = new Headers(cachedResponse.headers);
					const cachedEtag = cachedHeaders.get("etag");
					if (cachedEtag && ifNoneMatch === cachedEtag) {
						log("info", "Returning 304 Not Modified (HTTP cache hit)");
						const responseHeaders = new Headers({ etag: cachedEtag });
						const cachedLastModified = cachedHeaders.get("last-modified");
						if (cachedLastModified) {
							responseHeaders.set("last-modified", cachedLastModified);
						}
						return new Response(null, {
							status: 304,
							headers: responseHeaders,
						});
					}
					log("info", "Serving ICS file from HTTP cache");
					return cachedResponse;
				}

				// 2. Check KV cache and validate age
				const { value: kvIcs, metadata: kvMetadata } =
					await env.KNUE_CAL_KV.getWithMetadata<IcsMetadata>("latest", "text");

				let ics: string;
				let etag: string;
				let updatedAt: string;
				let servedStale = false;

				if (kvIcs && isCacheValid(kvMetadata?.updatedAt)) {
					// KV cache is valid, use it
					log("info", "Serving ICS file from KV cache (within 24 hours)");
					const extracted = await extractKvData(kvIcs, kvMetadata);
					ics = extracted.ics;
					etag = extracted.etag;
					updatedAt = extracted.updatedAt;
				} else {
					// KV cache is missing or stale, generate new ICS
					if (kvIcs) {
						log("info", "KV cache is stale, regenerating ICS");
					} else {
						log("info", "KV cache is empty, generating ICS");
					}
					try {
						const result = await generateAndSaveIcs(
							env,
							kvMetadata?.eventsHash,
						);
						ics = result.ics;
						etag = result.etag;
						updatedAt = result.updatedAt;

						// Push to Gist in background only when content changed (non-blocking, non-fatal)
						if (result.changed && env.GITHUB_TOKEN && env.GIST_ID) {
							ctx.waitUntil(
								updateGist(
									env.GITHUB_TOKEN,
									env.GIST_ID,
									ics,
									env.GIST_FILENAME,
								),
							);
						} else if (!result.changed && env.GITHUB_TOKEN && env.GIST_ID) {
							log("info", "Gist update skipped — content unchanged");
						}
					} catch (_genErr: unknown) {
						// If generation fails and we have old ICS, serve it
						if (kvIcs) {
							log(
								"warn",
								"ICS generation failed, serving stale cache as fallback",
							);
							const extracted = await extractKvData(kvIcs, kvMetadata);
							ics = extracted.ics;
							etag = extracted.etag;
							updatedAt = extracted.updatedAt;
							servedStale = true;
						} else {
							log("error", "ICS generation failed and no cache available");
							return new Response("Calendar not available yet", {
								status: 503,
								headers: { "retry-after": "3600" },
							});
						}
					}
				}

				const lastModified = new Date(updatedAt).toUTCString();

				// Check if client has the same etag
				if (ifNoneMatch === etag) {
					log("info", "Returning 304 Not Modified");
					const responseHeaders = new Headers({ etag });
					responseHeaders.set("last-modified", lastModified);
					return new Response(null, { status: 304, headers: responseHeaders });
				}

				// Build and cache response
				const icsResponse = buildIcsResponse(
					ics,
					etag,
					lastModified,
					servedStale,
				);
				await caches.default.put(cacheRequest, icsResponse.clone());

				log("info", "Serving ICS file");
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
};
