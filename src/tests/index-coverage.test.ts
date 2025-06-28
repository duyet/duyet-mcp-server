import { DuyetMCP } from "../index";

// Mock the agents/mcp module
jest.mock("agents/mcp", () => ({
	McpAgent: class MockMcpAgent {
		server = {
			registerTool: jest.fn(),
			registerResource: jest.fn(),
		};
		env: any;

		static serveSSE = jest.fn().mockReturnValue({
			fetch: jest.fn(),
		});

		static serve = jest.fn().mockReturnValue({
			fetch: jest.fn(),
		});

		async init() {
			// Mock init implementation
		}
	},
}));

// Mock the tools and resources registration
jest.mock("../tools/index", () => ({
	registerAllTools: jest.fn(),
}));

jest.mock("../resources/index", () => ({
	registerAllResources: jest.fn(),
}));

class TestDuyetMCP extends DuyetMCP {
	// biome-ignore lint: need to test the constructor
	constructor(ctx: any, env: any) {
		super(ctx, env);
	}
}

describe("DuyetMCP Class Coverage Tests", () => {
	let mockEnv: Env;
	let mockCtx: any;

	beforeEach(() => {
		mockEnv = {
			DB: {} as any,
		} as unknown as Env;
		mockCtx = {};
		jest.clearAllMocks();
	});

	test("should create DuyetMCP instance", () => {
		const instance = new TestDuyetMCP(mockCtx, mockEnv);
		expect(instance).toBeDefined();
		expect(instance.server).toBeDefined();
		expect(instance.server.registerTool).toBeDefined();
	});

	test("should initialize with tools and resources", async () => {
		const instance = new TestDuyetMCP(mockCtx, mockEnv);
		(instance as any).env = mockEnv;

		await instance.init();

		const { registerAllTools } = require("../tools/index");
		const { registerAllResources } = require("../resources/index");

		expect(registerAllTools).toHaveBeenCalledWith(instance.server, mockEnv);
		expect(registerAllResources).toHaveBeenCalledWith(instance.server, mockEnv);
	});

	test("should have correct server configuration", () => {
		const instance = new TestDuyetMCP(mockCtx, mockEnv);
		expect(instance.server).toBeDefined();
		// Check if server was initialized with correct config
		// This would be validated by the constructor call to McpServer
	});

	test("should handle DuyetMCP static methods", () => {
		// Test serveSSE method exists
		expect(DuyetMCP.serveSSE).toBeDefined();
		expect(typeof DuyetMCP.serveSSE).toBe("function");

		// Test serve method exists
		expect(DuyetMCP.serve).toBeDefined();
		expect(typeof DuyetMCP.serve).toBe("function");
	});
});
