import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";
import { log } from "../../src/utils/logger";

describe("Logger Utility", () => {
	let consoleSpy: MockInstance;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("should log info messages correctly", () => {
		consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		log("info", "Test message");

		expect(consoleSpy).toHaveBeenCalledWith(
			JSON.stringify({
				timestamp: "2024-01-01T12:00:00.000Z",
				level: "info",
				message: "Test message",
			}),
		);
	});

	it("should log warn messages correctly", () => {
		consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		log("warn", "Warning message");

		expect(consoleSpy).toHaveBeenCalledWith(
			JSON.stringify({
				timestamp: "2024-01-01T12:00:00.000Z",
				level: "warn",
				message: "Warning message",
			}),
		);
	});

	it("should log error messages correctly", () => {
		consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		log("error", "Error message");

		expect(consoleSpy).toHaveBeenCalledWith(
			JSON.stringify({
				timestamp: "2024-01-01T12:00:00.000Z",
				level: "error",
				message: "Error message",
			}),
		);
	});

	it("should include additional data when provided", () => {
		consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		const additionalData = { userId: 123, action: "test" };
		log("info", "Test with data", additionalData);

		expect(consoleSpy).toHaveBeenCalledWith(
			JSON.stringify({
				timestamp: "2024-01-01T12:00:00.000Z",
				level: "info",
				message: "Test with data",
				data: additionalData,
			}),
		);
	});
});
