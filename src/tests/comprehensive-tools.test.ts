/**
 * Comprehensive tests to achieve 100% coverage
 */

import { registerSendMessageTool } from "../tools/send-message";
import { registerContactAnalyticsTool } from "../tools/contact-analytics";

// Mock fetch for RSS and GitHub API
global.fetch = jest.fn();

// Mock database with proper promise handling
const mockDb = {
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
	getDb: jest.fn(() => mockDb),
}));

// Mock MCP server
const createMockServer = () =>
	({
		registerTool: jest.fn(),
	}) as any;

beforeEach(() => {
	jest.clearAllMocks();
	mockDb.execute.mockResolvedValue([]);
	(global.fetch as jest.Mock).mockClear();
});

describe("Comprehensive Tool Coverage Tests", () => {
	describe("Contact Analytics Tool - Full Coverage", () => {
		test("should register contact analytics tool", async () => {
			const mockServer = createMockServer();
			const mockEnv = { 
				DB: {} as D1Database,
				MCP_OBJECT: {} as DurableObjectNamespace,
				ANALYTICS: {} as AnalyticsEngineDataset
			} as unknown as Env;

			registerContactAnalyticsTool(mockServer, mockEnv);

			expect(mockServer.registerTool).toHaveBeenCalledWith(
				"contact_analytics",
				expect.any(Object),
				expect.any(Function),
			);
		});
	});

	describe("Send Message Tool - Full Coverage", () => {
		test("should handle successful message submission", async () => {
			const mockServer = createMockServer();
			const mockEnv = { 
				DB: {} as D1Database,
				MCP_OBJECT: {} as DurableObjectNamespace,
				ANALYTICS: {} as AnalyticsEngineDataset
			} as unknown as Env;

			let toolHandler: any;
			mockServer.registerTool.mockImplementation((_name: string, _config: any, handler: any) => {
				toolHandler = handler;
			});

			registerSendMessageTool(mockServer, mockEnv);

			// Mock successful database insert
			mockDb.values.mockResolvedValue(undefined);

			const result = await toolHandler({
				message: "Hello Duyet, I'm interested in hiring you for a data engineering role.",
				contact_email: "test@example.com",
				purpose: "job_opportunity",
			});

			expect(result.content[0].text).toContain("Message Sent Successfully");
			expect(result.content[0].text).toContain("Reference ID:");
			expect(result.content[0].text).toContain("job opportunity");
		});

		test("should handle database errors gracefully", async () => {
			const mockServer = createMockServer();
			const mockEnv = { 
				DB: {} as D1Database,
				MCP_OBJECT: {} as DurableObjectNamespace,
				ANALYTICS: {} as AnalyticsEngineDataset
			} as unknown as Env;

			let toolHandler: any;
			mockServer.registerTool.mockImplementation((_name: string, _config: any, handler: any) => {
				toolHandler = handler;
			});

			registerSendMessageTool(mockServer, mockEnv);

			// Simulate database error
			mockDb.values.mockRejectedValue(new Error("Database insert failed"));

			const result = await toolHandler({
				message: "Test message",
				purpose: "general_inquiry",
			});

			expect(result.content[0].text).toContain("could not be saved to our system");
			expect(result.content[0].text).toContain("me@duyet.net");
		});
	});

});