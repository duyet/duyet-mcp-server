
import { registerContactAnalyticsTool } from "../tools/contact-analytics";

// Mock database
const mockDb = {
	select: jest.fn().mockReturnThis(),
	from: jest.fn().mockReturnThis(),
	groupBy: jest.fn().mockReturnThis(),
	where: jest.fn().mockReturnThis(),
	orderBy: jest.fn().mockReturnThis(),
	limit: jest.fn().mockReturnThis(),
};

const mockGetDb = jest.fn(() => mockDb);

// Mock dependencies
jest.mock("../database/index", () => ({
	getDb: () => mockGetDb(),
}));

jest.mock("drizzle-orm", () => ({
	count: jest.fn(() => "count"),
	sql: jest.fn((strings: TemplateStringsArray, ...values: any[]) => ({
		strings,
		values,
		toString: () => strings.join("?"),
	})),
	gte: jest.fn(() => "gte"),
	and: jest.fn(() => "and"),
}));

describe("Contact Analytics Tool - Comprehensive Coverage", () => {
	let mockServer: { tool: jest.Mock };
	let mockEnv: Env;

	beforeEach(() => {
		mockServer = {
			tool: jest.fn(),
		};
		mockEnv = { DB: {} as any } as Env;
		jest.clearAllMocks();
	});

	describe("Registration", () => {
		test("should register contact_analytics tool", () => {
			registerContactAnalyticsTool(mockServer as any, mockEnv);
			
			expect(mockServer.tool).toHaveBeenCalledWith(
				"contact_analytics",
				expect.any(Object),
				expect.any(Function)
			);
		});
	});

	describe("Summary Report Type", () => {
		test("should handle summary with contacts", async () => {
			registerContactAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.tool.mock.calls[0];

			// Mock purpose breakdown query
			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.groupBy.mockResolvedValueOnce([
				{ purpose: "job_opportunity", count: 5 },
				{ purpose: "collaboration", count: 3 },
			]);

			// Mock recent count query
			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockResolvedValueOnce([{ count: 2 }]);

			const result = await handler({ report_type: "summary" });

			expect(result.content[0].text).toContain("Total Contacts: 8");
			expect(result.content[0].text).toContain("Recent (30 days): 2");
			expect(result.content[0].text).toContain("job opportunity: 5");
			expect(result.content[0].text).toContain("collaboration: 3");
		});

		test("should handle summary with no contacts", async () => {
			registerContactAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.tool.mock.calls[0];

			// Mock empty responses
			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.groupBy.mockResolvedValueOnce([]);

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockResolvedValueOnce([{ count: 0 }]);

			const result = await handler({ report_type: "summary" });

			expect(result.content[0].text).toContain("Total Contacts: 0");
			expect(result.content[0].text).toContain("No contacts yet");
		});
	});

	describe("Purpose Breakdown Report Type", () => {
		test("should handle purpose breakdown with data", async () => {
			registerContactAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.tool.mock.calls[0];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.groupBy.mockResolvedValueOnce([
				{ purpose: "job_opportunity", count: 6 },
				{ purpose: "collaboration", count: 4 },
			]);

			const result = await handler({ report_type: "purpose_breakdown" });

			expect(result.content[0].text).toContain("Total Contacts: 10");
			expect(result.content[0].text).toContain("job opportunity");
			expect(result.content[0].text).toContain("Count: 6");
			expect(result.content[0].text).toContain("Percentage: 60.0%");
			expect(result.content[0].text).toContain("collaboration");
			expect(result.content[0].text).toContain("Count: 4");
			expect(result.content[0].text).toContain("Percentage: 40.0%");
		});

		test("should handle purpose breakdown with no data", async () => {
			registerContactAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.tool.mock.calls[0];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.groupBy.mockResolvedValueOnce([]);

			const result = await handler({ report_type: "purpose_breakdown" });

			expect(result.content[0].text).toContain("Total Contacts: 0");
		});
	});

	describe("Daily Trends Report Type", () => {
		test("should handle daily trends with data", async () => {
			registerContactAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.tool.mock.calls[0];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.groupBy.mockReturnValueOnce(mockDb);
			mockDb.orderBy.mockReturnValueOnce(mockDb);
			mockDb.limit.mockResolvedValueOnce([
				{ date: "2024-01-15", daily_total: 3 },
				{ date: "2024-01-14", daily_total: 1 },
				{ date: "2024-01-13", daily_total: 2 },
			]);

			const result = await handler({ report_type: "daily_trends" });

			expect(result.content[0].text).toContain("Daily Contact Trends");
			expect(result.content[0].text).toContain("Total (30 days): 6");
			expect(result.content[0].text).toContain("Daily Average: 2.0");
			expect(result.content[0].text).toContain("Peak Day: 3 contacts");
			expect(result.content[0].text).toContain("Most Recent: 3 contacts");
		});

		test("should handle daily trends with no data", async () => {
			registerContactAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.tool.mock.calls[0];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.groupBy.mockReturnValueOnce(mockDb);
			mockDb.orderBy.mockReturnValueOnce(mockDb);
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await handler({ report_type: "daily_trends" });

			expect(result.content[0].text).toContain("Daily Contact Trends");
			expect(result.content[0].text).toContain("Total (30 days): 0");
			expect(result.content[0].text).toContain("Daily Average: NaN");
		});
	});

	describe("Recent Activity Report Type", () => {
		test("should handle recent activity with data", async () => {
			registerContactAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.tool.mock.calls[0];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.groupBy.mockResolvedValueOnce([
				{ purpose: "job_opportunity", total: 3, last_submission: "1642262400" },
				{ purpose: "collaboration", total: 2, last_submission: "1642176000" },
			]);

			const result = await handler({ report_type: "recent_activity" });

			expect(result.content[0].text).toContain("Recent Activity (Last 7 Days)");
			expect(result.content[0].text).toContain("Total Submissions: 5");
			expect(result.content[0].text).toContain("job opportunity");
			expect(result.content[0].text).toContain("Submissions: 3");
			expect(result.content[0].text).toContain("collaboration");
			expect(result.content[0].text).toContain("Submissions: 2");
			expect(result.content[0].text).toContain("Status: Active");
		});

		test("should handle recent activity with no data", async () => {
			registerContactAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.tool.mock.calls[0];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.groupBy.mockResolvedValueOnce([]);

			const result = await handler({ report_type: "recent_activity" });

			expect(result.content[0].text).toContain("Total Submissions: 0");
			expect(result.content[0].text).toContain("No recent activity");
			expect(result.content[0].text).toContain("Status: Quiet period");
		});
	});

	describe("Custom Period Report Type", () => {
		test("should handle custom period with valid dates and data", async () => {
			registerContactAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.tool.mock.calls[0];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.groupBy.mockResolvedValueOnce([
				{ purpose: "consulting", count: 4 },
				{ purpose: "general_inquiry", count: 2 },
			]);

			const result = await handler({ 
				report_type: "custom_period",
				date_from: "2024-01-01",
				date_to: "2024-01-31"
			});

			expect(result.content[0].text).toContain("Custom Period Analytics");
			expect(result.content[0].text).toContain("Total Contacts: 6");
			expect(result.content[0].text).toContain("consulting: 4");
			expect(result.content[0].text).toContain("general inquiry: 2");
		});

		test("should handle custom period without date_from", async () => {
			registerContactAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.tool.mock.calls[0];

			const result = await handler({ 
				report_type: "custom_period",
				date_to: "2024-01-31"
			});

			expect(result.content[0].text).toContain("Missing Date Range");
			expect(result.content[0].text).toContain("please provide both date_from and date_to");
		});

		test("should handle custom period without date_to", async () => {
			registerContactAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.tool.mock.calls[0];

			const result = await handler({ 
				report_type: "custom_period",
				date_from: "2024-01-01"
			});

			expect(result.content[0].text).toContain("Missing Date Range");
		});

		test("should handle custom period with invalid date format", async () => {
			registerContactAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.tool.mock.calls[0];

			const result = await handler({ 
				report_type: "custom_period",
				date_from: "invalid-date",
				date_to: "2024-01-31"
			});

			expect(result.content[0].text).toContain("Invalid date format");
			expect(result.content[0].text).toContain("YYYY-MM-DD format");
		});

		test("should handle custom period with invalid date_to format", async () => {
			registerContactAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.tool.mock.calls[0];

			const result = await handler({ 
				report_type: "custom_period",
				date_from: "2024-01-01",
				date_to: "invalid-date"
			});

			expect(result.content[0].text).toContain("Invalid date format");
		});
	});

	describe("Default Report Type", () => {
		test("should default to summary when no report_type specified", async () => {
			registerContactAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.tool.mock.calls[0];

			// Mock the database calls for summary
			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.groupBy.mockResolvedValueOnce([
				{ purpose: "job_opportunity", count: 2 },
			]);

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockResolvedValueOnce([{ count: 1 }]);

			const result = await handler({});

			expect(result.content[0].text).toContain("Contact Analytics Summary");
			expect(result.content[0].text).toContain("Total Contacts: 2");
		});
	});

	describe("Error Handling", () => {
		test("should handle database errors gracefully", async () => {
			registerContactAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.tool.mock.calls[0];

			// Mock database error
			mockDb.select.mockImplementation(() => {
				throw new Error("Database connection failed");
			});

			const result = await handler({ report_type: "summary" });

			expect(result.content[0].text).toContain("Unexpected Error");
			expect(result.content[0].text).toContain("Please try again later");
		});
	});
}); 