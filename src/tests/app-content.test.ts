import { describe, expect, it } from "bun:test";
import { calculateYearsOfExperience, getAboutDuyetData } from "../core/about";

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

	describe("getAboutDuyetData", () => {
		it("should return data with years of experience", () => {
			const data = getAboutDuyetData();
			const years = calculateYearsOfExperience();

			expect(data.content).toContain(`Data Engineer with ${years} years of experience`);
			expect(data.content).toContain("https://blog.duyet.net");
			expect(data.content).toContain("https://duyet.net/cv");
			expect(data.content).toContain("https://github.com/duyet");
		});

		it("should include all required URLs", () => {
			const data = getAboutDuyetData();

			expect(data.blogUrl).toBe("https://blog.duyet.net");
			expect(data.cvUrl).toBe("https://duyet.net/cv");
			expect(data.githubUrl).toBe("https://github.com/duyet");
			expect(data.profileUrl).toBe("https://duyet.net");
		});

		it("should have correct years of experience", () => {
			const data = getAboutDuyetData();
			const expectedYears = new Date().getFullYear() - 2017;

			expect(data.yearsOfExperience).toBe(expectedYears);
		});
	});
});
