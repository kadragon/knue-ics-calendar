import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { updateGist } from "../src/gist";

describe("updateGist", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	const VALID_GIST_ID = "a".repeat(32);

	it("should call GitHub API with correct parameters", async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValue(new Response("OK", { status: 200 }));
		globalThis.fetch = mockFetch;

		await updateGist("test-token", VALID_GIST_ID, "ICS content");

		expect(mockFetch).toHaveBeenCalledOnce();
		const [url, options] = mockFetch.mock.calls[0];
		expect(url).toBe(`https://api.github.com/gists/${VALID_GIST_ID}`);
		expect(options.method).toBe("PATCH");
		expect(options.headers.authorization).toBe("Bearer test-token");
		expect(options.headers.accept).toBe("application/vnd.github+json");

		const body = JSON.parse(options.body);
		expect(body.files["knue-calendar.ics"].content).toBe("ICS content");
	});

	it("should use custom filename when provided", async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValue(new Response("OK", { status: 200 }));
		globalThis.fetch = mockFetch;

		await updateGist("test-token", VALID_GIST_ID, "ICS content", "my-cal.ics");

		const [, options] = mockFetch.mock.calls[0];
		const body = JSON.parse(options.body);
		expect(body.files["my-cal.ics"].content).toBe("ICS content");
		expect(body.files["knue-calendar.ics"]).toBeUndefined();
	});

	it("should reject invalid gistId and not call fetch", async () => {
		const mockFetch = vi.fn();
		globalThis.fetch = mockFetch;

		await updateGist("test-token", "not-hex!", "ICS content");
		await updateGist("test-token", "", "ICS content");

		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("should log error on non-OK response without throwing", async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValue(new Response("Not Found", { status: 404 }));
		globalThis.fetch = mockFetch;

		await expect(
			updateGist("test-token", VALID_GIST_ID, "ICS content"),
		).resolves.toBeUndefined();
	});

	it("should catch fetch errors without throwing", async () => {
		const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
		globalThis.fetch = mockFetch;

		await expect(
			updateGist("test-token", VALID_GIST_ID, "ICS content"),
		).resolves.toBeUndefined();
	});
});
