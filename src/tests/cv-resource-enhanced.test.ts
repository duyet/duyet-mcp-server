import { describe, expect, test, beforeEach, mock, type Mock } from "bun:test";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCVResource } from "../resources/cv";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

// Mock fetch globally
const mockFetch = mock((_input: RequestInfo | URL, _init?: RequestInit) =>
	Promise.resolve({} as Response),
);
globalThis.fetch = mockFetch as unknown as typeof fetch;

// Create mock server factory
const createMockServer = () =>
	({
		registerResource: mock(() => undefined),
	}) as unknown as McpServer & { registerResource: Mock<(...args: unknown[]) => unknown> };

describe("CV Resource Enhanced Tests", () => {
	let mockServer: ReturnType<typeof createMockServer>;

	beforeEach(() => {
		mockServer = createMockServer();
		mockFetch.mockClear();
	});

	test("should register cv resource with all parameters", () => {
		registerCVResource(mockServer);
		expect(mockServer.registerResource).toHaveBeenCalledWith(
			"cv",
			expect.any(ResourceTemplate),
			expect.objectContaining({
				title: "Duyet's CV",
				description: expect.stringContaining("curriculum vitae"),
				mimeType: "text/plain",
			}),
			expect.any(Function),
		);
	});

	test("should handle JSON format with successful JSON fetch", async () => {
		mockFetch.mockImplementation((url) => {
			const urlString = String(url);
			if (urlString.includes("cv.json")) {
				return Promise.resolve({
					ok: true,
					text: async () =>
						'{"name": "Duyet", "title": "Senior Data Engineer", "experience": "8+ years"}',
				} as Response);
			}
			return Promise.resolve({
				ok: true,
				text: async () => "<title>Duyet - Senior Data Engineer</title>",
			} as Response);
		});

		let resourceHandler: any;
		mockServer.registerResource.mockImplementation((name, _template, _metadata, handler) => {
			if (name === "cv") {
				resourceHandler = handler;
			}
		});

		registerCVResource(mockServer);
		const result = await resourceHandler(new URL("duyet://cv/json"), { format: "json" });

		expect(result.contents[0].text).toContain("CV Data (JSON format)");
		expect(result.contents[0].text).toContain("name");
		expect(result.contents[0].text).toContain("Duyet");
		expect(result.contents[0].mimeType).toBe("application/json");
	});

	test("should handle main CV fetch error", async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			status: 500,
		} as Response);

		let resourceHandler: any;
		mockServer.registerResource.mockImplementation((name, _template, _metadata, handler) => {
			if (name === "cv") {
				resourceHandler = handler;
			}
		});

		registerCVResource(mockServer);
		const result = await resourceHandler(new URL("duyet://cv/summary"), { format: "summary" });

		expect(result.contents[0].text).toContain("Error fetching CV");
		expect(result.contents[0].text).toContain("Failed to fetch CV: 500");
		expect(result.contents[0].text).toContain("https://duyet.net/cv");
	});

	test("should handle network error when fetching CV", async () => {
		mockFetch.mockRejectedValue(new Error("Network timeout"));

		let resourceHandler: any;
		mockServer.registerResource.mockImplementation((name, _template, _metadata, handler) => {
			if (name === "cv") {
				resourceHandler = handler;
			}
		});

		registerCVResource(mockServer);
		const result = await resourceHandler(new URL("duyet://cv/summary"), { format: "summary" });

		expect(result.contents[0].text).toContain("Error fetching CV");
		expect(result.contents[0].text).toContain("Network timeout");
		expect(result.contents[0].text).toContain("https://duyet.net/cv");
	});

	test("should handle detailed format correctly", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			text: async () => "<title>Duyet - Senior Data Engineer</title><body>CV content</body>",
		} as Response);

		let resourceHandler: any;
		mockServer.registerResource.mockImplementation((name, _template, _metadata, handler) => {
			if (name === "cv") {
				resourceHandler = handler;
			}
		});

		registerCVResource(mockServer);
		const result = await resourceHandler(new URL("duyet://cv/detailed"), {
			format: "detailed",
		});

		expect(result.contents[0].text).toContain("Duyet - Senior Data Engineer");
		expect(result.contents[0].text).toContain("Full CV available at: https://duyet.net/cv");
		expect(result.contents[0].text).toContain("Key Highlights:");
		expect(result.contents[0].text).toContain("Sr. Data Engineer with");
		expect(result.contents[0].text).toContain("Expert in Data Engineering");
		expect(result.contents[0].text).toContain("Strong background in Rust, Python");
	});

	test("should default to summary format when no format specified", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			text: async () => "<title>Duyet - Senior Data Engineer</title><body>CV content</body>",
		} as Response);

		let resourceHandler: any;
		mockServer.registerResource.mockImplementation((name, _template, _metadata, handler) => {
			if (name === "cv") {
				resourceHandler = handler;
			}
		});

		registerCVResource(mockServer);
		const result = await resourceHandler(
			new URL("duyet://cv/summary"),
			{}, // No format specified
		);

		expect(result.contents[0].text).toContain("Duyet - Senior Data Engineer");
		expect(result.contents[0].text).toContain("CV Link: https://duyet.net/cv");
		expect(result.contents[0].text).toContain("Sr. Data Engineer with");
		expect(result.contents[0].text).toContain("Expertise: Data Engineering");
	});

	test("should verify resource registration parameters", () => {
		registerCVResource(mockServer);

		const registerCall = mockServer.registerResource.mock.calls[0] as [
			string,
			unknown,
			{ title: string; description: string; mimeType: string },
			Function,
		];
		const [name, template, metadata, handler] = registerCall;

		expect(name).toBe("cv");
		expect(template).toBeDefined();
		expect(metadata.title).toBe("Duyet's CV");
		expect(metadata.description).toContain("curriculum vitae");
		expect(metadata.mimeType).toBe("text/plain");
		expect(typeof handler).toBe("function");
	});
});
