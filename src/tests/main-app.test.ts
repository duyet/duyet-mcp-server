import { describe, expect, test } from "bun:test";
import { DuyetMCP } from "../index";

describe("Main Application Tests", () => {
	describe("DuyetMCP Class", () => {
		test("should have DuyetMCP constructor", () => {
			// Test that the class exists and can be referenced
			expect(DuyetMCP).toBeDefined();
			expect(typeof DuyetMCP).toBe("function");
		});

		test("should have static serve methods", () => {
			expect(DuyetMCP.serve).toBeDefined();
			expect(DuyetMCP.serveSSE).toBeDefined();
		});
	});
});
