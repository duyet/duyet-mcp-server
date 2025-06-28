// Mock dependencies first before any imports
jest.mock("drizzle-orm", () => ({
	eq: jest.fn(() => "eq"),
	gte: jest.fn(() => "gte"),
	lte: jest.fn(() => "lte"),
	and: jest.fn(() => "and"),
	sql: jest.fn(() => "sql"),
	integer: jest.fn(() => ({ default: jest.fn() })),
	text: jest.fn(() => ({})),
	pgTable: jest.fn(() => ({})),
}));

jest.mock("../database/schema", () => ({
	contacts: {
		referenceId: "referenceId",
		purpose: "purpose",
		createdAt: "createdAt",
		contactEmail: "contactEmail",
	},
}));

// Mock database
const mockDb = {
	select: jest.fn().mockReturnThis(),
	from: jest.fn().mockReturnThis(),
	where: jest.fn().mockReturnThis(),
	limit: jest.fn().mockReturnThis(),
	offset: jest.fn().mockReturnThis(),
};

const mockGetDb = jest.fn(() => mockDb);

jest.mock("../database/index", () => ({
	getDb: () => mockGetDb(),
}));

import { registerGetContactsTool } from "../tools/get-contacts";

describe("Get Contacts Tool - Comprehensive Coverage", () => {
	let mockServer: { registerTool: jest.Mock };
	let mockEnv: Env;

	beforeEach(() => {
		mockServer = {
			registerTool: jest.fn(),
		};
		mockEnv = { DB: {} as any } as Env;
		jest.clearAllMocks();
	});

	describe("Registration", () => {
		test("should register get_contacts tool", () => {
			registerGetContactsTool(mockServer as any, mockEnv);

			expect(mockServer.registerTool).toHaveBeenCalledWith(
				"get_contacts",
				expect.any(Object),
				expect.any(Function),
			);
		});
	});

	describe("Reference ID Query", () => {
		test("should handle specific contact by reference ID", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			const mockContact = {
				referenceId: "REF123",
				message: "Test message",
				contactEmail: "test@example.com",
				purpose: "job_opportunity",
				createdAt: new Date("2024-01-15T10:00:00Z"),
				ipAddress: "192.168.1.1",
				userAgent: "Mozilla/5.0",
			};

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockResolvedValueOnce([mockContact]);

			const result = await handler({ reference_id: "REF123" });

			expect(result.content[0].text).toContain("Contact Details");
			expect(result.content[0].text).toContain("Reference ID: REF123");
			expect(result.content[0].text).toContain("Message: Test message");
			expect(result.content[0].text).toContain("Email: test@example.com");
			expect(result.content[0].text).toContain("Purpose: job opportunity");
			expect(result.content[0].text).toContain("IP: 192.168.1.1");
			expect(result.content[0].text).toContain("User Agent: Mozilla/5.0");
		});

		test("should handle reference ID not found", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockResolvedValueOnce([]);

			const result = await handler({ reference_id: "NONEXISTENT" });

			expect(result.content[0].text).toContain("Contact Not Found");
			expect(result.content[0].text).toContain("Reference ID: NONEXISTENT");
			expect(result.content[0].text).toContain("Please check the reference ID");
		});

		test("should handle contact with no email", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			const mockContact = {
				referenceId: "REF456",
				message: "No email contact",
				contactEmail: null,
				purpose: "collaboration",
				createdAt: new Date("2024-01-15T10:00:00Z"),
				ipAddress: null,
				userAgent: null,
			};

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockResolvedValueOnce([mockContact]);

			const result = await handler({ reference_id: "REF456" });

			expect(result.content[0].text).toContain("Reference ID: REF456");
			expect(result.content[0].text).toContain("Message: No email contact");
			expect(result.content[0].text).toContain("Purpose: collaboration");
			expect(result.content[0].text).toContain("IP: N/A");
			expect(result.content[0].text).toContain("User Agent: N/A");
			expect(result.content[0].text).not.toContain("Email:");
		});
	});

	describe("Filtered Queries", () => {
		test("should handle purpose filter", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			const mockContacts = [
				{
					referenceId: "REF1",
					message: "Job application",
					contactEmail: "job@example.com",
					purpose: "job_opportunity",
					createdAt: new Date("2024-01-15T10:00:00Z"),
				},
			];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.limit.mockReturnValueOnce(mockDb);
			mockDb.offset.mockResolvedValueOnce(mockContacts);

			const result = await handler({ purpose: "job_opportunity" });

			expect(result.content[0].text).toContain("Contact Submissions");
			expect(result.content[0].text).toContain("purpose: job_opportunity");
			expect(result.content[0].text).toContain("1. job opportunity");
			expect(result.content[0].text).toContain("ID: REF1");
		});

		test("should handle email filter", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			const mockContacts = [
				{
					referenceId: "REF2",
					message: "Contact via email filter",
					contactEmail: "specific@example.com",
					purpose: "consulting",
					createdAt: new Date("2024-01-15T10:00:00Z"),
				},
			];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.limit.mockReturnValueOnce(mockDb);
			mockDb.offset.mockResolvedValueOnce(mockContacts);

			const result = await handler({ contact_email: "specific@example.com" });

			expect(result.content[0].text).toContain("contact_email: specific@example.com");
			expect(result.content[0].text).toContain("Email: specific@example.com");
		});

		test("should handle date_from filter", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			const mockContacts = [
				{
					referenceId: "REF3",
					message: "After date filter",
					contactEmail: "after@example.com",
					purpose: "general_inquiry",
					createdAt: new Date("2024-01-20T10:00:00Z"),
				},
			];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.limit.mockReturnValueOnce(mockDb);
			mockDb.offset.mockResolvedValueOnce(mockContacts);

			const result = await handler({ date_from: "2024-01-15" });

			expect(result.content[0].text).toContain("date_from: 2024-01-15");
			expect(result.content[0].text).toContain("After date filter");
		});

		test("should handle date_to filter", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			const mockContacts = [
				{
					referenceId: "REF4",
					message: "Before date filter",
					contactEmail: "before@example.com",
					purpose: "collaboration",
					createdAt: new Date("2024-01-10T10:00:00Z"),
				},
			];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.limit.mockReturnValueOnce(mockDb);
			mockDb.offset.mockResolvedValueOnce(mockContacts);

			const result = await handler({ date_to: "2024-01-15" });

			expect(result.content[0].text).toContain("date_to: 2024-01-15");
			expect(result.content[0].text).toContain("Before date filter");
		});

		test("should handle invalid date_from format", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.limit.mockReturnValueOnce(mockDb);
			mockDb.offset.mockResolvedValueOnce([]);

			const result = await handler({ date_from: "invalid-date" });

			// Should still work but skip invalid date filter
			expect(result.content[0].text).toContain("No Contacts Found");
		});

		test("should handle invalid date_to format", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.limit.mockReturnValueOnce(mockDb);
			mockDb.offset.mockResolvedValueOnce([]);

			const result = await handler({ date_to: "invalid-date" });

			// Should still work but skip invalid date filter
			expect(result.content[0].text).toContain("No Contacts Found");
		});

		test("should handle multiple filters combined", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			const mockContacts = [
				{
					referenceId: "REF5",
					message: "Multiple filters match",
					contactEmail: "multi@example.com",
					purpose: "job_opportunity",
					createdAt: new Date("2024-01-20T10:00:00Z"),
				},
			];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.limit.mockReturnValueOnce(mockDb);
			mockDb.offset.mockResolvedValueOnce(mockContacts);

			const result = await handler({
				purpose: "job_opportunity",
				contact_email: "multi@example.com",
				date_from: "2024-01-15",
				date_to: "2024-01-25",
			});

			expect(result.content[0].text).toContain("purpose: job_opportunity");
			expect(result.content[0].text).toContain("contact_email: multi@example.com");
			expect(result.content[0].text).toContain("date_from: 2024-01-15");
			expect(result.content[0].text).toContain("date_to: 2024-01-25");
		});
	});

	describe("Pagination", () => {
		test("should handle custom limit and offset", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			const mockContacts = Array.from({ length: 5 }, (_, i) => ({
				referenceId: `REF${i + 11}`,
				message: `Message ${i + 11}`,
				contactEmail: `user${i + 11}@example.com`,
				purpose: "collaboration",
				createdAt: new Date("2024-01-15T10:00:00Z"),
			}));

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.limit.mockReturnValueOnce(mockDb);
			mockDb.offset.mockResolvedValueOnce(mockContacts);

			const result = await handler({ limit: 5, offset: 10 });

			expect(result.content[0].text).toContain("Showing: 11-15 contacts");
			expect(result.content[0].text).toContain("Next page: Use offset 15");
			expect(result.content[0].text).toContain("11. collaboration");
			expect(result.content[0].text).toContain("15. collaboration");
		});

		test("should handle when limit equals results (has more data)", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			const mockContacts = Array.from({ length: 10 }, (_, i) => ({
				referenceId: `REF${i + 1}`,
				message: `Message ${i + 1}`,
				contactEmail: `user${i + 1}@example.com`,
				purpose: "consulting",
				createdAt: new Date("2024-01-15T10:00:00Z"),
			}));

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.limit.mockReturnValueOnce(mockDb);
			mockDb.offset.mockResolvedValueOnce(mockContacts);

			const result = await handler({ limit: 10 });

			expect(result.content[0].text).toContain("Next page: Use offset 10");
			expect(result.content[0].text).toContain("Increase offset parameter");
		});

		test("should handle when limit exceeds results (no more data)", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			const mockContacts = Array.from({ length: 3 }, (_, i) => ({
				referenceId: `REF${i + 1}`,
				message: `Message ${i + 1}`,
				contactEmail: `user${i + 1}@example.com`,
				purpose: "general_inquiry",
				createdAt: new Date("2024-01-15T10:00:00Z"),
			}));

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.limit.mockReturnValueOnce(mockDb);
			mockDb.offset.mockResolvedValueOnce(mockContacts);

			const result = await handler({ limit: 10 });

			expect(result.content[0].text).not.toContain("Next page");
			expect(result.content[0].text).not.toContain("Increase offset");
		});
	});

	describe("No Results Handling", () => {
		test("should handle no contacts found with filters", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.limit.mockReturnValueOnce(mockDb);
			mockDb.offset.mockResolvedValueOnce([]);

			const result = await handler({
				purpose: "job_opportunity",
				date_from: "2024-01-01",
			});

			expect(result.content[0].text).toContain("No Contacts Found");
			expect(result.content[0].text).toContain("purpose: job_opportunity");
			expect(result.content[0].text).toContain("date_from: 2024-01-01");
			expect(result.content[0].text).toContain("Try adjusting your search criteria");
		});

		test("should handle no contacts found without filters", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.limit.mockReturnValueOnce(mockDb);
			mockDb.offset.mockResolvedValueOnce([]);

			const result = await handler({});

			expect(result.content[0].text).toContain("No Contacts Found");
			expect(result.content[0].text).toContain("No filters applied");
		});
	});

	describe("Message Truncation", () => {
		test("should truncate long messages", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			const longMessage = "A".repeat(150); // 150 characters
			const mockContacts = [
				{
					referenceId: "REF_LONG",
					message: longMessage,
					contactEmail: "long@example.com",
					purpose: "consulting",
					createdAt: new Date("2024-01-15T10:00:00Z"),
				},
			];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.limit.mockReturnValueOnce(mockDb);
			mockDb.offset.mockResolvedValueOnce(mockContacts);

			const result = await handler({});

			expect(result.content[0].text).toContain(`${"A".repeat(100)}...`);
			expect(result.content[0].text).not.toContain(longMessage);
		});

		test("should not truncate short messages", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			const shortMessage = "Short message";
			const mockContacts = [
				{
					referenceId: "REF_SHORT",
					message: shortMessage,
					contactEmail: "short@example.com",
					purpose: "general_inquiry",
					createdAt: new Date("2024-01-15T10:00:00Z"),
				},
			];

			mockDb.select.mockReturnValueOnce(mockDb);
			mockDb.from.mockReturnValueOnce(mockDb);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.limit.mockReturnValueOnce(mockDb);
			mockDb.offset.mockResolvedValueOnce(mockContacts);

			const result = await handler({});

			expect(result.content[0].text).toContain("Message: Short message");
			expect(result.content[0].text).not.toContain("...");
		});
	});

	describe("Error Handling", () => {
		test("should handle database errors gracefully", async () => {
			registerGetContactsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0];

			// Mock database error
			mockDb.select.mockImplementation(() => {
				throw new Error("Database connection failed");
			});

			const result = await handler({});

			expect(result.content[0].text).toContain("Unexpected Error");
			expect(result.content[0].text).toContain("Please try again later");
		});
	});
});
