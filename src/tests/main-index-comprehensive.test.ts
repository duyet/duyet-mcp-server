import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Mock the agents/mcp module
jest.mock("agents/mcp", () => ({
	McpAgent: class MockMcpAgent {
		server = new McpServer({ name: "Duyet MCP Server", version: "0.1.0" });
		env: any;

		static serveSSE = jest.fn().mockReturnValue({
			fetch: jest.fn().mockResolvedValue(new Response("SSE response")),
		});

		static serve = jest.fn().mockReturnValue({
			fetch: jest.fn().mockResolvedValue(new Response("MCP response")),
		});

		async init() {
			// Mock init implementation
		}
	},
}));

// Mock the tools registration
jest.mock("../tools/index", () => ({
	registerAllTools: jest.fn(),
}));

describe("DuyetMCP Main Application", () => {
	let mockEnv: Env;
	let mockCtx: ExecutionContext;

	beforeEach(() => {
		mockEnv = {
			DB: {} as any,
		} as Env;

		mockCtx = {
			waitUntil: jest.fn(),
			passThroughOnException: jest.fn(),
		} as any;

		jest.clearAllMocks();
	});

	describe("DuyetMCP Class", () => {
		test("should have DuyetMCP exported", () => {
			const { DuyetMCP } = require("../index");
			expect(DuyetMCP).toBeDefined();
			expect(typeof DuyetMCP).toBe("function");
		});
	});

	describe("HTTP Routes", () => {
		test("should handle root path correctly", async () => {
			const { default: app } = require("../index");
			const request = new Request("http://localhost/");

			const response = await app.fetch(request, mockEnv, mockCtx);

			expect(response.status).toBe(302);
			expect(response.headers.get("Location")).toBe("/llms.txt");
		});

		test("should handle llms.txt path correctly", async () => {
			const { default: app } = require("../index");
			const request = new Request("http://localhost/llms.txt");

			const response = await app.fetch(request, mockEnv, mockCtx);
			const text = await response.text();

			expect(response.status).toBe(200);
			expect(text).toContain("Duyet MCP Server");
			expect(text).toContain("duyet-mcp-server");
		});

		test("should handle favicon redirect", async () => {
			const { default: app } = require("../index");
			const request = new Request("http://localhost/favicon.ico");

			const response = await app.fetch(request, mockEnv, mockCtx);

			expect(response.status).toBe(302);
			expect(response.headers.get("Location")).toBe("https://blog.duyet.net/icon.svg");
		});

		test("should handle SSE routes", async () => {
			const { DuyetMCP } = require("../index");
			const { default: app } = require("../index");
			const request = new Request("http://localhost/sse/test");

			const response = await app.fetch(request, mockEnv, mockCtx);

			expect(DuyetMCP.serveSSE).toHaveBeenCalledWith("/sse");
			expect(response).toBeDefined();
		});

		test("should handle MCP routes", async () => {
			const { DuyetMCP } = require("../index");
			const { default: app } = require("../index");
			const request = new Request("http://localhost/mcp/test");

			const response = await app.fetch(request, mockEnv, mockCtx);

			expect(DuyetMCP.serve).toHaveBeenCalledWith("/mcp");
			expect(response).toBeDefined();
		});
	});

	describe("WebSocket Upgrade Handling", () => {
		test("should handle WebSocket upgrade requests", async () => {
			const { DuyetMCP } = require("../index");
			const { default: app } = require("../index");
			const request = new Request("http://localhost/", {
				headers: { Upgrade: "websocket" },
			});

			const response = await app.fetch(request, mockEnv, mockCtx);

			expect(DuyetMCP.serve).toHaveBeenCalledWith("/mcp");
			expect(response).toBeDefined();
		});

		test("should handle regular HTTP requests when not WebSocket", async () => {
			const { default: app } = require("../index");
			const request = new Request("http://localhost/");

			const response = await app.fetch(request, mockEnv, mockCtx);

			expect(response.status).toBe(302);
			expect(response.headers.get("Location")).toBe("/llms.txt");
		});
	});

	describe("Error Handling", () => {
		test("should handle SSE route errors gracefully", async () => {
			const { DuyetMCP } = require("../index");
			const { default: app } = require("../index");

			// Mock fetch to throw an error
			DuyetMCP.serveSSE.mockReturnValue({
				fetch: jest.fn().mockRejectedValue(new Error("SSE Error")),
			});

			const request = new Request("http://localhost/sse/test");

			// Should return error response, not throw
			const response = await app.fetch(request, mockEnv, mockCtx);
			expect(response.status).toBe(500);
		});

		test("should handle MCP route errors gracefully", async () => {
			const { DuyetMCP } = require("../index");
			const { default: app } = require("../index");

			// Mock fetch to throw an error
			DuyetMCP.serve.mockReturnValue({
				fetch: jest.fn().mockRejectedValue(new Error("MCP Error")),
			});

			const request = new Request("http://localhost/mcp/test");

			// Should return error response, not throw
			const response = await app.fetch(request, mockEnv, mockCtx);
			expect(response.status).toBe(500);
		});
	});
});
