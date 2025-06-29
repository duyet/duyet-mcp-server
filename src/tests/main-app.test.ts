// Mock the github-activity resource to avoid ESM import issues
jest.mock("../resources/github-activity", () => ({
	registerGitHubActivityResource: jest.fn(),
}));

import { DuyetMCP } from "../index";

// Mock the agents library
jest.mock("agents/mcp", () => ({
	McpAgent: class MockMcpAgent {
		server = {
			tool: jest.fn(),
			registerTool: jest.fn(),
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
		test("should have DuyetMCP constructor", () => {
			// Test that the class exists and can be referenced
			expect(DuyetMCP).toBeDefined();
			expect(typeof DuyetMCP).toBe("function");
		});

		test("should have static serve methods", () => {
			expect(DuyetMCP.serve).toBeDefined();
			expect(DuyetMCP.serveSSE).toBeDefined();
		});
	});
});
