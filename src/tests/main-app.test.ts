import { describe, expect, test } from "bun:test";
import { createMcpServer } from "../index";

describe("Main Application Tests", () => {
	describe("MCP Server Factory", () => {
		test("should have createMcpServer exported", () => {
			expect(createMcpServer).toBeDefined();
			expect(typeof createMcpServer).toBe("function");
		});

		test("should register tools, resources, and prompts without throwing", () => {
			const env = { DB: {}, ANALYTICS: {} } as unknown as Env;
			expect(() => createMcpServer(env)).not.toThrow();
		});
	});
});
