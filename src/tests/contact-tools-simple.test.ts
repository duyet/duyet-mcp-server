/**
 * Simplified Contact tools integration tests
 */

import { registerContactTool } from '../tools/contact';
import { registerGetContactsTool } from '../tools/get-contacts';
import { registerContactAnalyticsTool } from '../tools/contact-analytics';

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
});

beforeEach(() => {
	jest.clearAllMocks();
	// Reset execute mock to return resolved promise by default
	mockDbOperations.execute.mockResolvedValue([]);
});

describe("Contact Tools Registration", () => {
	describe("Contact Tool", () => {
		test("should register contact tool successfully", () => {
			const mockServer = createMockServer();
			const mockEnv = {
				DB: {} as D1Database,
			};

			registerContactTool(mockServer as any, mockEnv as Env);
			
			expect(mockServer.tool).toHaveBeenCalledWith(
				"contact",
				expect.any(Object),
				expect.any(Function)
			);
		});
	});

	describe("Get Contacts Tool", () => {
		test("should register get contacts tool successfully", () => {
			const mockServer = createMockServer();
			const mockEnv = {
				DB: {} as D1Database,
			};

			registerGetContactsTool(mockServer as any, mockEnv as Env);
			
			expect(mockServer.tool).toHaveBeenCalledWith(
				"get_contacts",
				expect.any(Object),
				expect.any(Function)
			);
		});
	});

	describe("Contact Analytics Tool", () => {
		test("should register contact analytics tool successfully", () => {
			const mockServer = createMockServer();
			const mockEnv = {
				DB: {} as D1Database,
			};

			registerContactAnalyticsTool(mockServer as any, mockEnv as Env);
			
			expect(mockServer.tool).toHaveBeenCalledWith(
				"contact_analytics",
				expect.any(Object),
				expect.any(Function)
			);
		});
	});
});