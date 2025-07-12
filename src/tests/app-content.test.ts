// Jest globals are available without import in Jest environment
import { calculateYearsOfExperience, getAboutDuyetContent } from "../core/about";

describe("App Content Utilities", () => {
	describe("calculateYearsOfExperience", () => {
		it("should calculate correct years of experience from 2017", () => {
			const currentYear = new Date().getFullYear();
			const expectedYears = currentYear - 2017;

			const result = calculateYearsOfExperience();

			expect(result).toBe(expectedYears);
		});

		it("should return a positive number", () => {
			const result = calculateYearsOfExperience();

			expect(result).toBeGreaterThan(0);
		});
	});

	describe("getAboutDuyetContent", () => {
		it("should return content with years of experience", () => {
			const years = 5;
			const content = getAboutDuyetContent(years);

			expect(content).toContain(`Data Engineer with ${years} years of experience`);
			expect(content).toContain("https://blog.duyet.net");
			expect(content).toContain("https://duyet.net/cv");
			expect(content).toContain("https://github.com/duyet");
		});

		it("should handle different year values", () => {
			const years = 10;
			const content = getAboutDuyetContent(years);

			expect(content).toContain(`${years} years of experience`);
		});
	});
});
