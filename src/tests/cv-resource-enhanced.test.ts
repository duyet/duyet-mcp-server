import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCVResource } from "../resources/cv";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

// Mock fetch globally
global.fetch = jest.fn();

// Mock the McpServer
const mockServer = {
	registerResource: jest.fn(),
} as unknown as McpServer;

describe("CV Resource Enhanced Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
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
		let _fetchCallCount = 0;
		(global.fetch as jest.Mock).mockImplementation((url: string) => {
			_fetchCallCount++;
			if (url.includes("cv.json")) {
				return Promise.resolve({
					ok: true,
					text: async () =>
						'{"name": "Duyet", "title": "Senior Data Engineer", "experience": "8+ years"}',
				});
			}
			return Promise.resolve({
				ok: true,
				text: async () => "<title>Duyet - Senior Data Engineer</title>",
			});
		});

		let resourceHandler: any;
		(mockServer.registerResource as jest.Mock).mockImplementation(
			(name, _template, _metadata, handler) => {
				if (name === "cv") {
					resourceHandler = handler;
				}
			},
		);

		registerCVResource(mockServer);
		const result = await resourceHandler(
			new URL("duyet://cv/json"),
			{ format: "json" },
		);

		expect(result.contents[0].text).toContain("CV Data (JSON format)");
		expect(result.contents[0].text).toContain("name");
		expect(result.contents[0].text).toContain("Duyet");
		expect(result.contents[0].mimeType).toBe("application/json");
	});

	test("should handle JSON format when JSON endpoint returns error", async () => {
		let _fetchCallCount = 0;
		(global.fetch as jest.Mock).mockImplementation((url: string) => {
			_fetchCallCount++;
			if (url.includes("cv.json")) {
				return Promise.resolve({
					ok: false,
					status: 404,
				});
			}
			return Promise.resolve({
				ok: true,
				text: async () => "<title>Duyet - Senior Data Engineer</title>",
			});
		});

		let resourceHandler: any;
		(mockServer.registerResource as jest.Mock).mockImplementation(
			(name, _template, _metadata, handler) => {
				if (name === "cv") {
					resourceHandler = handler;
				}
			},
		);

		registerCVResource(mockServer);
		const result = await resourceHandler(
			new URL("duyet://cv/json"),
			{ format: "json" },
		);

		// Should fallback to summary format
		expect(result.contents[0].text).toContain("Duyet - Senior Data Engineer");
		expect(result.contents[0].text).toContain("CV Link");
		expect(result.contents[0].text).toContain("Sr. Data Engineer with");
	});

	test("should handle JSON format when JSON fetch throws exception", async () => {
		let _fetchCallCount = 0;
		(global.fetch as jest.Mock).mockImplementation((url: string) => {
			_fetchCallCount++;
			if (url.includes("cv.json")) {
				throw new Error("Network error");
			}
			return Promise.resolve({
				ok: true,
				text: async () => "<title>Duyet - Senior Data Engineer</title>",
			});
		});

		let resourceHandler: any;
		(mockServer.registerResource as jest.Mock).mockImplementation(
			(name, _template, _metadata, handler) => {
				if (name === "cv") {
					resourceHandler = handler;
				}
			},
		);

		registerCVResource(mockServer);
		const result = await resourceHandler(
			new URL("duyet://cv/json"),
			{ format: "json" },
		);

		// Should fallback to summary format
		expect(result.contents[0].text).toContain("Duyet - Senior Data Engineer");
		expect(result.contents[0].text).toContain("CV Link");
	});

	test("should handle main CV fetch error", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: false,
			status: 500,
		});

		let resourceHandler: any;
		(mockServer.registerResource as jest.Mock).mockImplementation(
			(name, _template, _metadata, handler) => {
				if (name === "cv") {
					resourceHandler = handler;
				}
			},
		);

		registerCVResource(mockServer);
		const result = await resourceHandler(
			new URL("duyet://cv/summary"),
			{ format: "summary" },
		);

		expect(result.contents[0].text).toContain("Error fetching CV");
		expect(result.contents[0].text).toContain("Failed to fetch CV: 500");
		expect(result.contents[0].text).toContain("https://duyet.net/cv");
	});

	test("should handle network error when fetching CV", async () => {
		(global.fetch as jest.Mock).mockRejectedValue(new Error("Network timeout"));

		let resourceHandler: any;
		(mockServer.registerResource as jest.Mock).mockImplementation(
			(name, _template, _metadata, handler) => {
				if (name === "cv") {
					resourceHandler = handler;
				}
			},
		);

		registerCVResource(mockServer);
		const result = await resourceHandler(
			new URL("duyet://cv/summary"),
			{ format: "summary" },
		);

		expect(result.contents[0].text).toContain("Error fetching CV");
		expect(result.contents[0].text).toContain("Network timeout");
		expect(result.contents[0].text).toContain("https://duyet.net/cv");
	});

	test("should handle non-Error exception", async () => {
		(global.fetch as jest.Mock).mockRejectedValue("String error");

		let resourceHandler: any;
		(mockServer.registerResource as jest.Mock).mockImplementation(
			(name, _template, _metadata, handler) => {
				if (name === "cv") {
					resourceHandler = handler;
				}
			},
		);

		registerCVResource(mockServer);
		const result = await resourceHandler(
			new URL("duyet://cv/summary"),
			{ format: "summary" },
		);

		expect(result.contents[0].text).toContain("Error fetching CV");
		expect(result.contents[0].text).toContain("Unknown error");
		expect(result.contents[0].text).toContain("https://duyet.net/cv");
	});

	test("should handle HTML without title tag", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			text: async () => "<html><body>CV content without title</body></html>",
		});

		let resourceHandler: any;
		(mockServer.registerResource as jest.Mock).mockImplementation(
			(name, _template, _metadata, handler) => {
				if (name === "cv") {
					resourceHandler = handler;
				}
			},
		);

		registerCVResource(mockServer);
		const result = await resourceHandler(
			new URL("duyet://cv/summary"),
			{ format: "summary" },
		);

		expect(result.contents[0].text).toContain("Duyet's CV");
		expect(result.contents[0].text).toContain("CV Link: https://duyet.net/cv");
	});

	test("should handle detailed format correctly", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			text: async () => "<title>Duyet - Senior Data Engineer</title><body>CV content</body>",
		});

		let resourceHandler: any;
		(mockServer.registerResource as jest.Mock).mockImplementation(
			(name, _template, _metadata, handler) => {
				if (name === "cv") {
					resourceHandler = handler;
				}
			},
		);

		registerCVResource(mockServer);
		const result = await resourceHandler(
			new URL("duyet://cv/detailed"),
			{ format: "detailed" },
		);

		expect(result.contents[0].text).toContain("Duyet - Senior Data Engineer");
		expect(result.contents[0].text).toContain("Full CV available at: https://duyet.net/cv");
		expect(result.contents[0].text).toContain("Key Highlights:");
		expect(result.contents[0].text).toContain("Sr. Data Engineer with");
		expect(result.contents[0].text).toContain("Expert in Data Engineering");
		expect(result.contents[0].text).toContain("Strong background in Rust, Python");
	});

	test("should default to summary format when no format specified", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			text: async () => "<title>Duyet - Senior Data Engineer</title><body>CV content</body>",
		});

		let resourceHandler: any;
		(mockServer.registerResource as jest.Mock).mockImplementation(
			(name, _template, _metadata, handler) => {
				if (name === "cv") {
					resourceHandler = handler;
				}
			},
		);

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

	test("should handle custom title format", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			text: async () => "<title>Custom CV Title - Duyet</title><body>CV content</body>",
		});

		let resourceHandler: any;
		(mockServer.registerResource as jest.Mock).mockImplementation(
			(name, _template, _metadata, handler) => {
				if (name === "cv") {
					resourceHandler = handler;
				}
			},
		);

		registerCVResource(mockServer);
		const result = await resourceHandler(
			new URL("duyet://cv/summary"),
			{ format: "summary" },
		);

		expect(result.contents[0].text).toContain("Custom CV Title - Duyet");
	});

	test("should verify resource registration parameters", () => {
		registerCVResource(mockServer);
		
		const registerCall = (mockServer.registerResource as jest.Mock).mock.calls[0];
		const [name, template, metadata, handler] = registerCall;
		
		expect(name).toBe("cv");
		expect(template).toBeDefined();
		expect(metadata.title).toBe("Duyet's CV");
		expect(metadata.description).toContain("curriculum vitae");
		expect(metadata.mimeType).toBe("text/plain");
		expect(typeof handler).toBe("function");
	});
}); 