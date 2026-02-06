import { describe, expect, test, beforeEach, mock, type Mock } from "bun:test";
import { registerGetAnalyticsTool } from "../tools/contact-analytics";

const createMockServer = () =>
	({
		registerTool: mock(() => undefined),
	}) as unknown as { registerTool: Mock<(...args: unknown[]) => unknown> };

describe("Contact Analytics Tool - Comprehensive Coverage", () => {
	let mockServer: ReturnType<typeof createMockServer>;
	let mockEnv: Env;

	beforeEach(() => {
		mockServer = createMockServer();
		mockEnv = { DB: {} as D1Database } as Env;
	});

	describe("Registration", () => {
		test("should register get_analytics tool", () => {
			registerGetAnalyticsTool(mockServer as any, mockEnv);

			expect(mockServer.registerTool).toHaveBeenCalledWith(
				"get_analytics",
				expect.any(Object),
				expect.any(Function),
			);
		});
	});

	describe("Custom Period Report Type", () => {
		test("should handle custom period without date_from", async () => {
			registerGetAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0] as [
				string,
				unknown,
				(...args: unknown[]) => Promise<{ content: { text: string }[] }>,
			];

			const result = await handler({
				report_type: "custom_period",
				date_to: "2024-01-31",
			});

			expect(result.content[0].text).toContain("Missing Date Range");
			expect(result.content[0].text).toContain("please provide both date_from and date_to");
		});

		test("should handle custom period without date_to", async () => {
			registerGetAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0] as [
				string,
				unknown,
				(...args: unknown[]) => Promise<{ content: { text: string }[] }>,
			];

			const result = await handler({
				report_type: "custom_period",
				date_from: "2024-01-01",
			});

			expect(result.content[0].text).toContain("Missing Date Range");
		});

		test("should handle custom period with invalid date format", async () => {
			registerGetAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0] as [
				string,
				unknown,
				(...args: unknown[]) => Promise<{ content: { text: string }[] }>,
			];

			const result = await handler({
				report_type: "custom_period",
				date_from: "invalid-date",
				date_to: "2024-01-31",
			});

			expect(result.content[0].text).toContain("Invalid date format");
			expect(result.content[0].text).toContain("YYYY-MM-DD format");
		});

		test("should handle custom period with invalid date_to format", async () => {
			registerGetAnalyticsTool(mockServer as any, mockEnv);
			const [, , handler] = mockServer.registerTool.mock.calls[0] as [
				string,
				unknown,
				(...args: unknown[]) => Promise<{ content: { text: string }[] }>,
			];

			const result = await handler({
				report_type: "custom_period",
				date_from: "2024-01-01",
				date_to: "invalid-date",
			});

			expect(result.content[0].text).toContain("Invalid date format");
		});
	});
});
