import { describe, expect, test } from "bun:test";
import { DuyetMCP } from "../index";

describe("DuyetMCP Class Coverage Tests", () => {
	test("should have DuyetMCP class defined", () => {
		expect(DuyetMCP).toBeDefined();
		expect(typeof DuyetMCP).toBe("function");
	});

	test("should have DuyetMCP static methods", () => {
		// Test serveSSE method exists
		expect(DuyetMCP.serveSSE).toBeDefined();
		expect(typeof DuyetMCP.serveSSE).toBe("function");

		// Test serve method exists
		expect(DuyetMCP.serve).toBeDefined();
		expect(typeof DuyetMCP.serve).toBe("function");
	});
});
