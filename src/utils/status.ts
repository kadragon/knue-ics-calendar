import { CACHE_CONFIG } from "../constants";
import type { Env } from "../types";

export type CacheStatus = "fresh" | "stale" | "missing" | "unknown";

export type StatusReport = {
	status: CacheStatus;
	updatedAt: string | null;
	ageSeconds: number | null;
	checkedAt: string;
	maxAgeSeconds: number;
};

/**
 * Classify the KV-cached ICS by its `updatedAt` metadata.
 * Read-only: never fetches the source site, regenerates, or writes any cache.
 * Reflects KV state only — not edge cache or subscriber calendar freshness.
 */
export const getCacheStatus = async (
	env: Env,
	now: Date = new Date(),
): Promise<StatusReport> => {
	const base = {
		updatedAt: null,
		ageSeconds: null,
		checkedAt: now.toISOString(),
		maxAgeSeconds: CACHE_CONFIG.kvTtl,
	};

	let value: string | null;
	let metadata: { updatedAt?: unknown } | null;
	try {
		({ value, metadata } = await env.KNUE_CAL_KV.getWithMetadata<{
			updatedAt?: unknown;
		}>("latest", "text"));
	} catch {
		return { ...base, status: "unknown" };
	}

	if (value === null) return { ...base, status: "missing" };

	const updatedAt =
		typeof metadata?.updatedAt === "string" ? metadata.updatedAt : null;
	const updatedMs = updatedAt === null ? Number.NaN : Date.parse(updatedAt);
	const ageMs = now.getTime() - updatedMs;
	// Missing, unparseable, or future timestamps cannot be trusted
	if (Number.isNaN(ageMs) || ageMs < 0) {
		return { ...base, updatedAt, status: "unknown" };
	}

	const ageSeconds = Math.floor(ageMs / 1000);
	return {
		...base,
		updatedAt,
		ageSeconds,
		status: ageSeconds < CACHE_CONFIG.kvTtl ? "fresh" : "stale",
	};
};
