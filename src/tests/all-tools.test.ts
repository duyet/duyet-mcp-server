import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetCVTool } from "../tools/get-cv";
import { registerHireMeTool } from "../tools/hire-me";
import { registerSayHiTool } from "../tools/say-hi";
import { registerSendMessageTool } from "../tools/send-message";
import { registerGetAnalyticsTool } from "../tools/contact-analytics";

// Mock fetch globally
global.fetch = jest.fn();

// Mock Octokit for GitHub Activity tool
const mockListPublicEventsForUser = jest.fn();
jest.mock("@octokit/rest", () => ({
	Octokit: jest.fn().mockImplementation(() => ({
		rest: {
			activity: {
				listPublicEventsForUser: mockListPublicEventsForUser,
			},
		},
	})),
}));

import { registerAllTools } from "../tools/index";

// Mock the McpServer
const mockServer = {
	registerTool: jest.fn(),
} as unknown as McpServer;

// Mock environment
const mockEnv = {
	DB: {} as D1Database,
	MCP_OBJECT: {} as DurableObjectNamespace,
	ANALYTICS: {} as AnalyticsEngineDataset,
} as unknown as Env;

describe("Tool Registration Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Mock fetch responses
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			status: 200,
			text: async () => "<title>Duyet - Senior Data Engineer</title><body>CV content</body>",
		});
	});

	describe("Send Message Tool", () => {
		test("should register send_message tool", () => {
			registerSendMessageTool(mockServer, mockEnv);
			expect(mockServer.registerTool).toHaveBeenCalledWith(
				"send_message",
				expect.any(Object),
				expect.any(Function),
			);
		});
	});

	describe("Get CV Tool", () => {
		test("should register get-cv tool", () => {
			registerGetCVTool(mockServer);
			expect(mockServer.registerTool).toHaveBeenCalledWith(
				"get_cv",
				expect.any(Object),
				expect.any(Function),
			);
		});

		test("should handle CV tool with summary format", async () => {
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
		});

		test("should handle CV tool with detailed format", async () => {
			let toolHandler: any;
			(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
				if (name === "get_cv") {
					toolHandler = handler;
				}
			});

			registerGetCVTool(mockServer);
			const result = await toolHandler({ format: "detailed" });
			expect(result.content[0].text).toContain("Key Highlights");
			expect(result.content[0].text).toContain("Duyet - Senior Data Engineer");
		});

		test("should handle CV tool with json format", async () => {
			let toolHandler: any;
			(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
				if (name === "get_cv") {
					toolHandler = handler;
				}
			});

			// Mock JSON CV response
			(global.fetch as jest.Mock).mockImplementation((url: string) => {
				if (url.includes("cv.json")) {
					return Promise.resolve({
						ok: true,
						text: async () => '{"name": "Duyet", "title": "Senior Data Engineer"}',
					});
				}
				return Promise.resolve({
					ok: true,
					text: async () => "<title>Duyet - Senior Data Engineer</title>",
				});
			});

			registerGetCVTool(mockServer);
			const result = await toolHandler({ format: "json" });
			expect(result.content[0].text).toContain("name");
			expect(result.content[0].text).toContain("title");
		});
	});

	describe("Hire Me Tool", () => {
		test("should register hire-me tool", () => {
			registerHireMeTool(mockServer, mockEnv);
			expect(mockServer.registerTool).toHaveBeenCalledWith(
				"hire_me",
				expect.any(Object),
				expect.any(Function),
			);
		});

		test("should handle hire-me tool with all parameters", async () => {
			let toolHandler: any;
			(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
				if (name === "hire_me") {
					toolHandler = handler;
				}
			});

			registerHireMeTool(mockServer, mockEnv);
			const result = await toolHandler({
				role_type: "full_time",
				company_size: "startup",
				tech_stack: "React, Node.js, TypeScript",
			});
			expect(result.content[0].text).toContain("Hire Duyet");
			expect(result.content[0].text).toContain("Full-time");
			expect(result.content[0].text).toContain("fast-paced");
		});

		test("should handle hire-me tool with minimal parameters", async () => {
			let toolHandler: any;
			(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
				if (name === "hire_me") {
					toolHandler = handler;
				}
			});

			registerHireMeTool(mockServer, mockEnv);
			const result = await toolHandler({});
			expect(result.content[0].text).toContain("Hire Duyet");
		});
	});

	describe("Say Hi Tool", () => {
		test("should register say-hi tool", () => {
			registerSayHiTool(mockServer);
			expect(mockServer.registerTool).toHaveBeenCalledWith(
				"say_hi",
				expect.any(Object),
				expect.any(Function),
			);
		});

		test("should handle say-hi tool without message", async () => {
			let toolHandler: any;
			(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
				if (name === "say_hi") {
					toolHandler = handler;
				}
			});

			registerSayHiTool(mockServer);
			const result = await toolHandler({});
			expect(result.content[0].text).toContain("Hi Duyet!");
			expect(result.content[0].text).toContain("me@duyet.net");
		});

		test("should handle say-hi tool with custom message", async () => {
			let toolHandler: any;
			(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
				if (name === "say_hi") {
					toolHandler = handler;
				}
			});

			registerSayHiTool(mockServer);
			const result = await toolHandler({ message: "How are you today?" });
			expect(result.content[0].text).toContain("Hi Duyet! How are you today?");
			expect(result.content[0].text).toContain("me@duyet.net");
		});
	});

	describe("Contact Analytics Tool", () => {
		test("should register get_analytics tool", () => {
			registerGetAnalyticsTool(mockServer, mockEnv);
			expect(mockServer.registerTool).toHaveBeenCalledWith(
				"get_analytics",
				expect.any(Object),
				expect.any(Function),
			);
		});
	});

	describe("Tool Registry", () => {
		test("should register all tools", () => {
			registerAllTools(mockServer, mockEnv);
			// Should have called tool registration for all 8 tools
			expect(mockServer.registerTool).toHaveBeenCalledTimes(8);
		});
	});
});
