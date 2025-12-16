/**
 * Simple resource coverage test to improve overall coverage above 90%
 */
import { describe, expect, test, beforeEach, mock } from "bun:test";
import { registerAboutDuyetResource } from "../resources/about-duyet";
import { calculateYearsOfExperience, getAboutDuyetData } from "../core/about";

// Mock fetch globally
const mockFetch = mock(() => Promise.resolve({} as Response));
globalThis.fetch = mockFetch as unknown as typeof fetch;

// Simple mock server
const createMockServer = () =>
	({
		registerResource: mock(() => undefined),
	}) as any;

describe("Resource Coverage Tests", () => {
	beforeEach(() => {
		mockFetch.mockClear();
		mockFetch.mockResolvedValue({
			ok: true,
			text: async () => "<title>Test</title>",
			json: async () => [{ type: "PushEvent" }],
		} as Response);
	});

	test("should improve about-duyet resource coverage", () => {
		const mockServer = createMockServer();
		registerAboutDuyetResource(mockServer);
		expect(mockServer.registerResource).toHaveBeenCalled();
	});

	test("should call utility functions", () => {
		const years = calculateYearsOfExperience();
		expect(years).toBeGreaterThan(0);

		const data = getAboutDuyetData();
		expect(data.content).toContain("Duyet");
		expect(data.yearsOfExperience).toBeGreaterThan(0);
	});
});
