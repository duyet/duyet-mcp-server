/**
 * Simplified Contact tools integration tests
 */

import { registerSendMessageTool } from "../tools/send-message";
import { registerGetAnalyticsTool } from "../tools/contact-analytics";
import { registerHireMeTool } from "../tools/hire-me";

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

import { registerGitHubActivityTool } from "../tools/github-activity";

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
	// Reset GitHub API mock
	mockListPublicEventsForUser.mockResolvedValue({ data: [] });
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
				ANALYTICS: {} as AnalyticsEngineDataset
			} as unknown as Env;

			registerHireMeTool(mockServer as any, mockEnv);

			expect(mockServer.registerTool).toHaveBeenCalledWith(
				"hire_me",
				expect.any(Object),
				expect.any(Function),
			);
		});

		test("should handle hire_me tool execution with database save", async () => {
			const mockServer = createMockServer();
			const mockEnv = {
				DB: {} as D1Database,
				MCP_OBJECT: {} as DurableObjectNamespace,
				ANALYTICS: {} as AnalyticsEngineDataset
			} as unknown as Env;

			let toolHandler: any;
			mockServer.registerTool.mockImplementation((name: string, _config: any, handler: any) => {
				if (name === "hire_me") {
					toolHandler = handler;
				}
			});

			// Mock successful database insert
			mockDbOperations.values.mockResolvedValue(undefined);

			registerHireMeTool(mockServer as any, mockEnv);

			const result = await toolHandler({
				role_type: "full_time",
				tech_stack: "clickhouse, rust, python",
				company_size: "startup",
				contact_email: "test@example.com",
				additional_notes: "Looking for senior role"
			});

			expect(result.content).toBeDefined();
			expect(result.content[0].text).toContain("Hire Duyet - Senior Data Engineer");
			expect(result.content[0].text).toContain("Inquiry Reference ID:");
			expect(mockDbOperations.insert).toHaveBeenCalled();
			expect(mockDbOperations.values).toHaveBeenCalledWith(
				expect.objectContaining({
					purpose: "hire_me",
					roleType: "full_time",
					techStack: "clickhouse, rust, python",
					companySize: "startup",
					contactEmail: "test@example.com",
				})
			);
		});

		test("should handle hire_me tool execution without database save when no optional data", async () => {
			const mockServer = createMockServer();
			const mockEnv = {
				DB: {} as D1Database,
				MCP_OBJECT: {} as DurableObjectNamespace,
				ANALYTICS: {} as AnalyticsEngineDataset
			} as unknown as Env;

			let toolHandler: any;
			mockServer.registerTool.mockImplementation((name: string, _config: any, handler: any) => {
				if (name === "hire_me") {
					toolHandler = handler;
				}
			});

			registerHireMeTool(mockServer as any, mockEnv);

			const result = await toolHandler({});

			expect(result.content).toBeDefined();
			expect(result.content[0].text).toContain("Hire Duyet - Senior Data Engineer");
			expect(result.content[0].text).not.toContain("Inquiry Reference ID:");
			expect(mockDbOperations.insert).not.toHaveBeenCalled();
		});

		test("should handle database error gracefully", async () => {
			const mockServer = createMockServer();
			const mockEnv = {
				DB: {} as D1Database,
				MCP_OBJECT: {} as DurableObjectNamespace,
				ANALYTICS: {} as AnalyticsEngineDataset
			} as unknown as Env;

			let toolHandler: any;
			mockServer.registerTool.mockImplementation((name: string, _config: any, handler: any) => {
				if (name === "hire_me") {
					toolHandler = handler;
				}
			});

			// Mock database error
			mockDbOperations.values.mockRejectedValue(new Error("Database error"));

			registerHireMeTool(mockServer as any, mockEnv);

			const result = await toolHandler({
				contact_email: "test@example.com",
				additional_notes: "Test inquiry"
			});

			expect(result.content).toBeDefined();
			expect(result.content[0].text).toContain("Hire Duyet - Senior Data Engineer");
			expect(result.content[0].text).not.toContain("Inquiry Reference ID:");
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
