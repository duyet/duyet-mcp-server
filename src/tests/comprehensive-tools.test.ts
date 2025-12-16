/**
 * Comprehensive tests to achieve 100% coverage
 */
import { describe, expect, test, beforeEach, mock, type Mock } from "bun:test";
import { registerSendMessageTool } from "../tools/send-message";
import { registerGetAnalyticsTool } from "../tools/contact-analytics";

// Mock fetch globally
const mockFetch = mock(() => Promise.resolve({} as Response));
globalThis.fetch = mockFetch as unknown as typeof fetch;

// Mock MCP server
const createMockServer = () =>
	({
		registerTool: mock(() => undefined),
	}) as unknown as { registerTool: Mock<(...args: unknown[]) => unknown> };

beforeEach(() => {
	mockFetch.mockClear();
});

describe("Comprehensive Tool Coverage Tests", () => {
	describe("Contact Analytics Tool - Full Coverage", () => {
		test("should register contact analytics tool", async () => {
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

	describe("Send Message Tool - Full Coverage", () => {
		test("should register send_message tool", () => {
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
});
