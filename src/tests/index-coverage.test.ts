import { describe, expect, test } from "bun:test";
import { createMcpServer } from "../index";

describe("createMcpServer Coverage Tests", () => {
	test("should have createMcpServer defined", () => {
		expect(createMcpServer).toBeDefined();
		expect(typeof createMcpServer).toBe("function");
	});

	test("should create a fresh MCP server instance per call", () => {
		const env = { DB: {}, ANALYTICS: {} } as unknown as Env;
		const a = createMcpServer(env);
		const b = createMcpServer(env);
		expect(a).toBeDefined();
		expect(b).toBeDefined();
		expect(a).not.toBe(b);
	});
});
