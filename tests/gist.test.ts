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

	it("should call GitHub API with correct parameters", async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValue(new Response("OK", { status: 200 }));
		globalThis.fetch = mockFetch;

		await updateGist("test-token", "gist-123", "ICS content");

		expect(mockFetch).toHaveBeenCalledOnce();
		const [url, options] = mockFetch.mock.calls[0];
		expect(url).toBe("https://api.github.com/gists/gist-123");
		expect(options.method).toBe("PATCH");
		expect(options.headers.authorization).toBe("Bearer test-token");
		expect(options.headers.accept).toBe("application/vnd.github+json");

		const body = JSON.parse(options.body);
		expect(body.files["knue-calendar.ics"].content).toBe("ICS content");
	});

	it("should log error on non-OK response without throwing", async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValue(new Response("Not Found", { status: 404 }));
		globalThis.fetch = mockFetch;

		// Should not throw
		await expect(
			updateGist("test-token", "bad-id", "ICS content"),
		).resolves.toBeUndefined();
	});

	it("should catch fetch errors without throwing", async () => {
		const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
		globalThis.fetch = mockFetch;

		// updateGist catches all errors internally — never throws
		await expect(
			updateGist("test-token", "gist-123", "ICS content"),
		).resolves.toBeUndefined();
	});
});
