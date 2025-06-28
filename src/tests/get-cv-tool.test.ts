import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetCVTool } from "../tools/get-cv";

// Mock fetch globally
global.fetch = jest.fn();

// Mock the McpServer
const mockServer = {
	registerTool: jest.fn(),
} as unknown as McpServer;

describe("Get CV Tool Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("should register get-cv tool", () => {
		registerGetCVTool(mockServer);
		expect(mockServer.registerTool).toHaveBeenCalledWith(
			"get_cv",
			expect.objectContaining({
				title: "Get CV",
				description: expect.stringContaining("CV (curriculum vitae)"),
			}),
			expect.any(Function),
		);
	});

	test("should handle summary format with successful fetch", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			text: async () => "<title>Duyet - Senior Data Engineer</title><body>CV content</body>",
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_cv") {
				toolHandler = handler;
			}
		});

		registerGetCVTool(mockServer);
		const result = await toolHandler({ format: "summary" });

		expect(result.content[0].text).toContain("Duyet - Senior Data Engineer");
		expect(result.content[0].text).toContain("Sr. Data Engineer with");
		expect(result.content[0].text).toContain("https://duyet.net/cv");
	});

	test("should handle detailed format with successful fetch", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			text: async () => "<title>Duyet - Senior Data Engineer</title><body>CV content</body>",
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_cv") {
				toolHandler = handler;
			}
		});

		registerGetCVTool(mockServer);
		const result = await toolHandler({ format: "detailed" });

		expect(result.content[0].text).toContain("Duyet - Senior Data Engineer");
		expect(result.content[0].text).toContain("Key Highlights");
		expect(result.content[0].text).toContain("Full CV available at");
	});

	test("should handle json format with successful JSON fetch", async () => {
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

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_cv") {
				toolHandler = handler;
			}
		});

		registerGetCVTool(mockServer);
		const result = await toolHandler({ format: "json" });

		expect(result.content[0].text).toContain("JSON format");
		expect(result.content[0].text).toContain("name");
		expect(result.content[0].text).toContain("Duyet");
	});

	test("should fallback to summary when JSON fetch fails", async () => {
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

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_cv") {
				toolHandler = handler;
			}
		});

		registerGetCVTool(mockServer);
		const result = await toolHandler({ format: "json" });

		expect(result.content[0].text).toContain("Duyet - Senior Data Engineer");
		expect(result.content[0].text).toContain("Sr. Data Engineer with");
	});

	test("should handle network error gracefully", async () => {
		(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_cv") {
				toolHandler = handler;
			}
		});

		registerGetCVTool(mockServer);
		const result = await toolHandler({ format: "summary" });

		expect(result.content[0].text).toContain("Error fetching CV");
		expect(result.content[0].text).toContain("Network error");
		expect(result.content[0].text).toContain("https://duyet.net/cv");
	});

	test("should handle HTTP error response", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: false,
			status: 500,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_cv") {
				toolHandler = handler;
			}
		});

		registerGetCVTool(mockServer);
		const result = await toolHandler({ format: "summary" });

		expect(result.content[0].text).toContain("Error fetching CV");
		expect(result.content[0].text).toContain("Failed to fetch CV: 500");
		expect(result.content[0].text).toContain("https://duyet.net/cv");
	});

	test("should handle default format when none specified", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			text: async () => "<title>Duyet - Senior Data Engineer</title><body>CV content</body>",
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_cv") {
				toolHandler = handler;
			}
		});

		registerGetCVTool(mockServer);
		const result = await toolHandler({});

		expect(result.content[0].text).toContain("Duyet - Senior Data Engineer");
		expect(result.content[0].text).toContain("Sr. Data Engineer with");
	});

	test("should handle title extraction from HTML", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			text: async () =>
				"<HTML><HEAD><title>Custom CV Title</title></HEAD><body>CV content</body></HTML>",
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_cv") {
				toolHandler = handler;
			}
		});

		registerGetCVTool(mockServer);
		const result = await toolHandler({ format: "summary" });

		expect(result.content[0].text).toContain("Custom CV Title");
	});

	test("should use fallback title when no title in HTML", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			text: async () => "<body>CV content without title</body>",
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_cv") {
				toolHandler = handler;
			}
		});

		registerGetCVTool(mockServer);
		const result = await toolHandler({ format: "summary" });

		expect(result.content[0].text).toContain("Duyet's CV");
	});
});
