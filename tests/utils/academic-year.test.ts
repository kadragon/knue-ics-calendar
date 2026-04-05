import { describe, expect, it } from "vitest";
import {
	getAcademicYear,
	getAcademicYearsToFetch,
} from "../../src/utils/academic-year";

describe("getAcademicYear", () => {
	it("should return current year for March (start of academic year)", () => {
		expect(getAcademicYear(new Date("2026-03-01"))).toBe(2026);
	});

	it("should return current year for December", () => {
		expect(getAcademicYear(new Date("2026-12-15"))).toBe(2026);
	});

	it("should return previous year for January", () => {
		expect(getAcademicYear(new Date("2026-01-15"))).toBe(2025);
	});

	it("should return previous year for February", () => {
		expect(getAcademicYear(new Date("2026-02-28"))).toBe(2025);
	});
});

describe("getAcademicYearsToFetch", () => {
	it("should return [current, previous] academic years for April", () => {
		expect(getAcademicYearsToFetch(new Date("2026-04-05"))).toEqual([
			2026, 2025,
		]);
	});

	it("should return [current, previous] academic years for January", () => {
		expect(getAcademicYearsToFetch(new Date("2026-01-15"))).toEqual([
			2025, 2024,
		]);
	});
});
