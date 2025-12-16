/**
 * Simplified Contact tools integration tests
 */
import { describe, expect, test, beforeEach, mock, type Mock } from "bun:test";
import { registerSendMessageTool } from "../tools/send-message";
import { registerGetAnalyticsTool } from "../tools/contact-analytics";
import { registerHireMeTool } from "../tools/hire-me";
import { registerGitHubActivityTool } from "../tools/github-activity";

// Mock fetch for GitHub Activity tool
const mockFetch = mock(() => Promise.resolve({} as Response));
globalThis.fetch = mockFetch as unknown as typeof fetch;

// Mock MCP server
const createMockServer = () =>
	({
		tool: mock(() => undefined),
		registerTool: mock(() => undefined),
	}) as unknown as {
		tool: Mock<(...args: unknown[]) => unknown>;
		registerTool: Mock<(...args: unknown[]) => unknown>;
	};

beforeEach(() => {
	mockFetch.mockClear();
	mockFetch.mockResolvedValue({
		ok: true,
		status: 200,
		json: mock(() => Promise.resolve([])),
	} as unknown as Response);
});

describe("Contact Tools Registration", () => {
	describe("Send Message Tool", () => {
		test("should register send_message tool successfully", () => {
			const mockServer = createMockServer();
			const mockEnv = {
				DB: {} as D1Database,
				MCP_OBJECT: {} as DurableObjectNamespace,
				ANALYTICS: {} as AnalyticsEngineDataset,
			} as unknown as Env;

			registerSendMessageTool(mockServer as any, mockEnv);

			expect(mockServer.registerTool).toHaveBeenCalledWith(
				"send_message",
				expect.any(Object),
				expect.any(Function),
			);
		});
	});

	describe("Contact Analytics Tool", () => {
		test("should register contact analytics tool successfully", () => {
			const mockServer = createMockServer();
			const mockEnv = {
				DB: {} as D1Database,
				MCP_OBJECT: {} as DurableObjectNamespace,
				ANALYTICS: {} as AnalyticsEngineDataset,
			} as unknown as Env;

			registerGetAnalyticsTool(mockServer as any, mockEnv);

			expect(mockServer.registerTool).toHaveBeenCalledWith(
				"get_analytics",
				expect.any(Object),
				expect.any(Function),
			);
		});
	});

	describe("Hire Me Tool", () => {
		test("should register hire_me tool successfully", () => {
			const mockServer = createMockServer();
			const mockEnv = {
				DB: {} as D1Database,
				MCP_OBJECT: {} as DurableObjectNamespace,
				ANALYTICS: {} as AnalyticsEngineDataset,
			} as unknown as Env;

			registerHireMeTool(mockServer as any, mockEnv);

			expect(mockServer.registerTool).toHaveBeenCalledWith(
				"hire_me",
				expect.any(Object),
				expect.any(Function),
			);
		});

		test("should handle hire_me tool execution without optional data", async () => {
			const mockServer = createMockServer();
			const mockEnv = {
				DB: {} as D1Database,
				MCP_OBJECT: {} as DurableObjectNamespace,
				ANALYTICS: {} as AnalyticsEngineDataset,
			} as unknown as Env;

			let toolHandler: any;
			mockServer.registerTool.mockImplementation(
				(name: unknown, _config: unknown, handler: unknown) => {
					if (name === "hire_me") {
						toolHandler = handler;
					}
				},
			);

			registerHireMeTool(mockServer as any, mockEnv);

			const result = await toolHandler({});

			expect(result.content).toBeDefined();
			expect(result.content[0].text).toContain("Hire Duyet - Senior Data Engineer");
		});
	});

	describe("GitHub Activity Tool", () => {
		test("should register github_activity tool successfully", () => {
			const mockServer = createMockServer();

			registerGitHubActivityTool(mockServer as any);

			expect(mockServer.registerTool).toHaveBeenCalledWith(
				"github_activity",
				expect.any(Object),
				expect.any(Function),
			);
		});
	});
});
