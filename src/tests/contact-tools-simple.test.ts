/**
 * Simplified Contact tools integration tests
 */

import { registerSendMessageTool } from "../tools/send-message";
import { registerContactAnalyticsTool } from "../tools/contact-analytics";

// Mock database operations with proper promise handling
const mockDbOperations = {
	select: jest.fn().mockReturnThis(),
	from: jest.fn().mockReturnThis(),
	where: jest.fn().mockReturnThis(),
	insert: jest.fn().mockReturnThis(),
	values: jest.fn().mockReturnThis(),
	returning: jest.fn().mockReturnThis(),
	groupBy: jest.fn().mockReturnThis(),
	orderBy: jest.fn().mockReturnThis(),
	limit: jest.fn().mockReturnThis(),
	offset: jest.fn().mockReturnThis(),
	execute: jest.fn(),
};

jest.mock("../database", () => ({
	getDb: jest.fn(() => mockDbOperations),
}));

// Mock MCP server
const createMockServer = () => ({
	tool: jest.fn(),
	registerTool: jest.fn(),
});

beforeEach(() => {
	jest.clearAllMocks();
	// Reset execute mock to return resolved promise by default
	mockDbOperations.execute.mockResolvedValue([]);
});

describe("Contact Tools Registration", () => {
	describe("Send Message Tool", () => {
		test("should register send_message tool successfully", () => {
			const mockServer = createMockServer();
			const mockEnv = {
				DB: {} as D1Database,
				MCP_OBJECT: {} as DurableObjectNamespace,
				ANALYTICS: {} as AnalyticsEngineDataset
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
				ANALYTICS: {} as AnalyticsEngineDataset
			} as unknown as Env;

			registerContactAnalyticsTool(mockServer as any, mockEnv);

			expect(mockServer.registerTool).toHaveBeenCalledWith(
				"contact_analytics",
				expect.any(Object),
				expect.any(Function),
			);
		});
	});
});
