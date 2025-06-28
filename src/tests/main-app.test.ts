import { DuyetMCP } from "../index";

// Mock the agents library
jest.mock("agents/mcp", () => ({
	McpAgent: class MockMcpAgent {
		server = {
			tool: jest.fn(),
		};
		env = {};
		async init() {}
		static serve = jest.fn().mockReturnValue({
			fetch: jest.fn(),
		});
		static serveSSE = jest.fn().mockReturnValue({
			fetch: jest.fn(),
		});
	},
}));

// Mock registerAllTools
jest.mock("../tools/index", () => ({
	registerAllTools: jest.fn(),
}));

describe("Main Application Tests", () => {
	describe("DuyetMCP Class", () => {
		test("should create DuyetMCP instance", () => {
			const mcpInstance = new DuyetMCP();
			expect(mcpInstance).toBeInstanceOf(DuyetMCP);
			expect(mcpInstance.server).toBeDefined();
		});

		test("should have correct server configuration", () => {
			const mcpInstance = new DuyetMCP();
			expect(mcpInstance.server).toBeDefined();
		});

		test("should call init method", async () => {
			const mcpInstance = new DuyetMCP();
			mcpInstance.env = {} as Env;
			
			// Mock registerAllTools
			const { registerAllTools } = require("../tools/index");
			
			await mcpInstance.init();
			expect(registerAllTools).toHaveBeenCalledWith(mcpInstance.server, mcpInstance.env);
		});

		test("should have serve methods", () => {
			expect(DuyetMCP.serve).toBeDefined();
			expect(DuyetMCP.serveSSE).toBeDefined();
		});
	});
});