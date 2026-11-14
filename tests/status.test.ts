import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_CONFIG } from "../src/constants";
import worker from "../src/index";
import type { Env } from "../src/types";
import {
	createMockExecutionContext,
	createMockRequest,
	installMockCaches,
	MockKVNamespace,
} from "./helpers/mocks";

vi.mock("../src/parser", () => ({
	getEventsFromSite: vi.fn().mockResolvedValue([]),
}));

const NOW = new Date("2026-03-10T00:00:00.000Z");
const STATUS_URL = "https://example.com/status.json";
const ICS = "BEGIN:VCALENDAR\nEND:VCALENDAR";

type StatusBody = {
	status: string;
	updatedAt: string | null;
	ageSeconds: number | null;
	checkedAt: string;
	maxAgeSeconds: number;
};

describe("GET /status.json", () => {
	let kvStore: MockKVNamespace;
	let env: Env;
	let cacheRestore: { restore(): void };

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
		kvStore = new MockKVNamespace();
		env = { KNUE_CAL_KV: kvStore as unknown as KVNamespace };
		cacheRestore = installMockCaches();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
		cacheRestore.restore();
	});

	const fetchStatus = async (): Promise<{
		response: Response;
		body: StatusBody;
	}> => {
		const response = await worker.fetch(
			createMockRequest(STATUS_URL),
			env,
			createMockExecutionContext(),
		);
		return { response, body: (await response.json()) as StatusBody };
	};

	const secondsAgo = (s: number) =>
		new Date(NOW.getTime() - s * 1000).toISOString();

	it("reports fresh with timestamps and age for a recent cache", async () => {
		const updatedAt = secondsAgo(3600);
		await kvStore.put("latest", ICS, { metadata: { updatedAt, etag: "e" } });

		const { response, body } = await fetchStatus();

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe(
			"application/json; charset=utf-8",
		);
		expect(response.headers.get("cache-control")).toBe("no-store");
		expect(body).toEqual({
			status: "fresh",
			updatedAt,
			ageSeconds: 3600,
			checkedAt: NOW.toISOString(),
			maxAgeSeconds: CACHE_CONFIG.kvTtl,
		});
	});

	it("reports stale once the cache reaches the KV TTL", async () => {
		const updatedAt = secondsAgo(CACHE_CONFIG.kvTtl);
		await kvStore.put("latest", ICS, { metadata: { updatedAt } });

		const { body } = await fetchStatus();

		expect(body.status).toBe("stale");
		expect(body.ageSeconds).toBe(CACHE_CONFIG.kvTtl);
		expect(body.updatedAt).toBe(updatedAt);
	});

	it("reports missing when KV holds no calendar", async () => {
		const { response, body } = await fetchStatus();

		expect(response.status).toBe(200);
		expect(body.status).toBe("missing");
		expect(body.updatedAt).toBeNull();
		expect(body.ageSeconds).toBeNull();
	});

	it("reports unknown when updatedAt metadata is absent", async () => {
		await kvStore.put("latest", ICS);

		const { body } = await fetchStatus();

		expect(body.status).toBe("unknown");
		expect(body.updatedAt).toBeNull();
		expect(body.ageSeconds).toBeNull();
	});

	it("reports unknown when updatedAt is not a valid date", async () => {
		await kvStore.put("latest", ICS, { metadata: { updatedAt: "not-a-date" } });

		const { body } = await fetchStatus();

		expect(body.status).toBe("unknown");
		expect(body.updatedAt).toBe("not-a-date");
		expect(body.ageSeconds).toBeNull();
	});

	it("reports unknown when updatedAt is in the future", async () => {
		const updatedAt = secondsAgo(-600);
		await kvStore.put("latest", ICS, { metadata: { updatedAt } });

		const { body } = await fetchStatus();

		expect(body.status).toBe("unknown");
		expect(body.updatedAt).toBe(updatedAt);
		expect(body.ageSeconds).toBeNull();
	});

	it("reports unknown when the KV read throws", async () => {
		vi.spyOn(kvStore, "getWithMetadata").mockRejectedValue(
			new Error("KV down"),
		);

		const { response, body } = await fetchStatus();

		expect(response.status).toBe(200);
		expect(response.headers.get("cache-control")).toBe("no-store");
		expect(body.status).toBe("unknown");
	});

	it.each([
		["fresh", () => secondsAgo(60)],
		["stale", () => secondsAgo(CACHE_CONFIG.kvTtl + 60)],
		["missing", null],
		["future", () => secondsAgo(-60)],
	] as const)(
		"does not regenerate, write KV, or touch the HTTP cache (%s)",
		async (_label, updatedAtFn) => {
			if (updatedAtFn) {
				await kvStore.put("latest", ICS, {
					metadata: { updatedAt: updatedAtFn() },
				});
			}
			const { getEventsFromSite } = await import("../src/parser");
			const putSpy = vi.spyOn(kvStore, "put");
			const cacheMatch = vi.spyOn(caches.default, "match");
			const cachePut = vi.spyOn(caches.default, "put");

			await fetchStatus();

			expect(getEventsFromSite).not.toHaveBeenCalled();
			expect(putSpy).not.toHaveBeenCalled();
			expect(cacheMatch).not.toHaveBeenCalled();
			expect(cachePut).not.toHaveBeenCalled();
		},
	);
});
