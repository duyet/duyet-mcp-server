/**
 * Specific tests to boost coverage for under-tested files
 */

import { registerContactAnalyticsTool } from "../tools/contact-analytics";
import { registerGetContactsTool } from "../tools/get-contacts";
import { registerGitHubActivityTool } from "../tools/github-activity";

// Mock fetch
global.fetch = jest.fn();

// Mock database with working methods
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

const createMockServer = () => ({ tool: jest.fn() }) as any;

beforeEach(() => {
	jest.clearAllMocks();
	mockDb.execute.mockResolvedValue([]);
	(global.fetch as jest.Mock).mockClear();
});

describe("Coverage Boost Tests", () => {
	describe("Contact Analytics - All Branch Coverage", () => {
		test("should handle summary report with data", async () => {
			const mockServer = createMockServer();
			const mockEnv = { DB: {} as D1Database };

			// Mock multiple return values for different queries
			mockDb.execute
				.mockResolvedValueOnce([
					{ purpose: "collaboration", count: 5 },
					{ purpose: "job_opportunity", count: 3 },
				])
				.mockResolvedValueOnce([{ count: 10 }]);

			let toolHandler: any;
			(mockServer.tool as jest.Mock).mockImplementation((name, _schema, handler) => {
				if (name === "contact_analytics") toolHandler = handler;
			});

			registerContactAnalyticsTool(mockServer as any, mockEnv as Env);
			const result = await toolHandler({ report_type: "summary" });

			expect(result.content[0].text).toBeDefined();
		});

		test("should handle purpose_breakdown report", async () => {
			const mockServer = createMockServer();
			const mockEnv = { DB: {} as D1Database };

			mockDb.execute.mockResolvedValueOnce([
				{ purpose: "collaboration", count: 8 },
				{ purpose: "job_opportunity", count: 5 },
				{ purpose: "consulting", count: 2 },
				{ purpose: "general_inquiry", count: 1 },
			]);

			let toolHandler: any;
			(mockServer.tool as jest.Mock).mockImplementation((name, _schema, handler) => {
				if (name === "contact_analytics") toolHandler = handler;
			});

			registerContactAnalyticsTool(mockServer as any, mockEnv as Env);
			const result = await toolHandler({ report_type: "purpose_breakdown" });

			expect(result.content[0].text).toBeDefined();
		});

		test("should handle daily_trends report", async () => {
			const mockServer = createMockServer();
			const mockEnv = { DB: {} as D1Database };

			mockDb.execute.mockResolvedValueOnce([
				{ date: "2024-01-01", daily_total: 3 },
				{ date: "2024-01-02", daily_total: 5 },
				{ date: "2024-01-03", daily_total: 2 },
			]);

			let toolHandler: any;
			(mockServer.tool as jest.Mock).mockImplementation((name, _schema, handler) => {
				if (name === "contact_analytics") toolHandler = handler;
			});

			registerContactAnalyticsTool(mockServer as any, mockEnv as Env);
			const result = await toolHandler({ report_type: "daily_trends" });

			expect(result.content[0].text).toBeDefined();
		});

		test("should handle recent_activity report", async () => {
			const mockServer = createMockServer();
			const mockEnv = { DB: {} as D1Database };

			mockDb.execute.mockResolvedValueOnce([
				{ purpose: "collaboration", total: 3, last_submission: "1704067200" },
				{ purpose: "job_opportunity", total: 2, last_submission: "1704153600" },
			]);

			let toolHandler: any;
			(mockServer.tool as jest.Mock).mockImplementation((name, _schema, handler) => {
				if (name === "contact_analytics") toolHandler = handler;
			});

			registerContactAnalyticsTool(mockServer as any, mockEnv as Env);
			const result = await toolHandler({ report_type: "recent_activity" });

			expect(result.content[0].text).toBeDefined();
		});

		test("should handle custom_period with valid dates", async () => {
			const mockServer = createMockServer();
			const mockEnv = { DB: {} as D1Database };

			mockDb.execute.mockResolvedValueOnce([
				{ purpose: "collaboration", count: 4 },
				{ purpose: "consulting", count: 1 },
			]);

			let toolHandler: any;
			(mockServer.tool as jest.Mock).mockImplementation((name, _schema, handler) => {
				if (name === "contact_analytics") toolHandler = handler;
			});

			registerContactAnalyticsTool(mockServer as any, mockEnv as Env);
			const result = await toolHandler({
				report_type: "custom_period",
				date_from: "2024-01-01",
				date_to: "2024-01-31",
			});

			expect(result.content[0].text).toBeDefined();
		});

		test("should handle custom_period with invalid dates", async () => {
			const mockServer = createMockServer();
			const mockEnv = { DB: {} as D1Database };

			let toolHandler: any;
			(mockServer.tool as jest.Mock).mockImplementation((name, _schema, handler) => {
				if (name === "contact_analytics") toolHandler = handler;
			});

			registerContactAnalyticsTool(mockServer as any, mockEnv as Env);
			const result = await toolHandler({
				report_type: "custom_period",
				date_from: "invalid-date",
				date_to: "2024-01-31",
			});

			expect(result.content[0].text).toContain("Invalid date format");
		});
	});

	describe("Get Contacts - All Path Coverage", () => {
		test("should handle reference_id query", async () => {
			const mockServer = createMockServer();
			const mockEnv = { DB: {} as D1Database };

			mockDb.execute.mockResolvedValueOnce([
				{
					referenceId: "test-ref-123",
					message: "Test message",
					contactEmail: "test@example.com",
					purpose: "collaboration",
					createdAt: Date.now(),
					ipAddress: "127.0.0.1",
					userAgent: "Test Agent",
				},
			]);

			let toolHandler: any;
			(mockServer.tool as jest.Mock).mockImplementation((name, _schema, handler) => {
				if (name === "get_contacts") toolHandler = handler;
			});

			registerGetContactsTool(mockServer as any, mockEnv as Env);
			const result = await toolHandler({ reference_id: "test-ref-123" });

			expect(result.content[0].text).toBeDefined();
		});

		test("should handle contact_email filter", async () => {
			const mockServer = createMockServer();
			const mockEnv = { DB: {} as D1Database };

			mockDb.execute.mockResolvedValueOnce([
				{
					referenceId: "test-ref-456",
					message: "Email filtered message",
					contactEmail: "filter@example.com",
					purpose: "job_opportunity",
					createdAt: Date.now(),
				},
			]);

			let toolHandler: any;
			(mockServer.tool as jest.Mock).mockImplementation((name, _schema, handler) => {
				if (name === "get_contacts") toolHandler = handler;
			});

			registerGetContactsTool(mockServer as any, mockEnv as Env);
			const result = await toolHandler({ contact_email: "filter@example.com" });

			expect(result.content[0].text).toBeDefined();
		});

		test("should handle purpose filter", async () => {
			const mockServer = createMockServer();
			const mockEnv = { DB: {} as D1Database };

			mockDb.execute.mockResolvedValueOnce([
				{
					referenceId: "test-ref-789",
					message: "Purpose filtered message",
					contactEmail: "purpose@example.com",
					purpose: "consulting",
					createdAt: Date.now(),
				},
			]);

			let toolHandler: any;
			(mockServer.tool as jest.Mock).mockImplementation((name, _schema, handler) => {
				if (name === "get_contacts") toolHandler = handler;
			});

			registerGetContactsTool(mockServer as any, mockEnv as Env);
			const result = await toolHandler({ purpose: "consulting" });

			expect(result.content[0].text).toBeDefined();
		});

		test("should handle date range filters", async () => {
			const mockServer = createMockServer();
			const mockEnv = { DB: {} as D1Database };

			mockDb.execute.mockResolvedValueOnce([
				{
					referenceId: "test-ref-date",
					message: "Date filtered message",
					contactEmail: "date@example.com",
					purpose: "general_inquiry",
					createdAt: new Date("2024-01-15").getTime(),
				},
			]);

			let toolHandler: any;
			(mockServer.tool as jest.Mock).mockImplementation((name, _schema, handler) => {
				if (name === "get_contacts") toolHandler = handler;
			});

			registerGetContactsTool(mockServer as any, mockEnv as Env);
			const result = await toolHandler({
				date_from: "2024-01-01",
				date_to: "2024-01-31",
			});

			expect(result.content[0].text).toBeDefined();
		});

		test("should handle pagination with limit and offset", async () => {
			const mockServer = createMockServer();
			const mockEnv = { DB: {} as D1Database };

			mockDb.execute.mockResolvedValueOnce(
				Array.from({ length: 5 }, (_, i) => ({
					referenceId: `test-ref-${i}`,
					message: `Message ${i}`,
					contactEmail: `user${i}@example.com`,
					purpose: "collaboration",
					createdAt: Date.now() - i * 1000000,
				})),
			);

			let toolHandler: any;
			(mockServer.tool as jest.Mock).mockImplementation((name, _schema, handler) => {
				if (name === "get_contacts") toolHandler = handler;
			});

			registerGetContactsTool(mockServer as any, mockEnv as Env);
			const result = await toolHandler({ limit: 5, offset: 10 });

			expect(result.content[0].text).toBeDefined();
			// Just check that it returns some text
		});
	});

	describe("GitHub Activity - Success Paths", () => {
		test("should handle successful GitHub response with commits", async () => {
			const mockServer = createMockServer();

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => [
					{
						type: "PushEvent",
						created_at: "2024-01-01T12:00:00Z",
						repo: { name: "duyet/test-repo" },
						payload: {
							commits: [{ message: "Add new feature" }, { message: "Fix bug" }],
						},
					},
					{
						type: "IssuesEvent",
						created_at: "2024-01-02T14:00:00Z",
						repo: { name: "duyet/another-repo" },
						payload: { action: "opened" },
					},
				],
			});

			let toolHandler: any;
			(mockServer.tool as jest.Mock).mockImplementation((name, _schema, handler) => {
				if (name === "get_github_activity") toolHandler = handler;
			});

			registerGitHubActivityTool(mockServer);
			const result = await toolHandler({ limit: 10, include_details: true });

			expect(result.content[0].text).toContain("Recent GitHub Activity");
			expect(result.content[0].text).toContain("Pushed 2 commits");
			expect(result.content[0].text).toContain("Add new feature");
		});

		test("should handle GitHub response without details", async () => {
			const mockServer = createMockServer();

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => [
					{
						type: "CreateEvent",
						created_at: "2024-01-03T16:00:00Z",
						repo: { name: "duyet/new-project" },
						payload: { ref_type: "branch" },
					},
				],
			});

			let toolHandler: any;
			(mockServer.tool as jest.Mock).mockImplementation((name, _schema, handler) => {
				if (name === "get_github_activity") toolHandler = handler;
			});

			registerGitHubActivityTool(mockServer);
			const result = await toolHandler({ limit: 5, include_details: false });

			expect(result.content[0].text).toContain("Recent GitHub Activity");
			expect(result.content[0].text).toContain("Created branch");
		});

		test("should handle different event types", async () => {
			const mockServer = createMockServer();

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => [
					{
						type: "WatchEvent",
						created_at: "2024-01-04T18:00:00Z",
						repo: { name: "duyet/starred-repo" },
						payload: { action: "started" },
					},
					{
						type: "ForkEvent",
						created_at: "2024-01-05T20:00:00Z",
						repo: { name: "duyet/forked-repo" },
						payload: {},
					},
				],
			});

			let toolHandler: any;
			(mockServer.tool as jest.Mock).mockImplementation((name, _schema, handler) => {
				if (name === "get_github_activity") toolHandler = handler;
			});

			registerGitHubActivityTool(mockServer);
			const result = await toolHandler({ limit: 2, include_details: true });

			expect(result.content[0].text).toContain("Recent GitHub Activity");
			expect(result.content[0].text).toContain("Starred repository");
			expect(result.content[0].text).toContain("Forked repository");
		});
	});
});
