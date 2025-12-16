import { describe, expect, test, beforeEach, mock } from "bun:test";
import app, { DuyetMCP } from "../index";

describe("DuyetMCP Main Application", () => {
	let mockEnv: Env;
	let mockCtx: ExecutionContext;

	beforeEach(() => {
		mockEnv = {
			DB: {} as D1Database,
			MCP_OBJECT: {} as DurableObjectNamespace,
			ANALYTICS: {} as AnalyticsEngineDataset,
		} as unknown as Env;

		mockCtx = {
			waitUntil: mock(() => undefined),
			passThroughOnException: mock(() => undefined),
		} as unknown as ExecutionContext;
	});

	describe("DuyetMCP Class", () => {
		test("should have DuyetMCP exported", () => {
			expect(DuyetMCP).toBeDefined();
			expect(typeof DuyetMCP).toBe("function");
		});
	});

	describe("HTTP Routes", () => {
		test("should handle root path correctly", async () => {
			const request = new Request("http://localhost/");

			const response = await app.fetch(request, mockEnv, mockCtx);

			expect(response.status).toBe(302);
			expect(response.headers.get("Location")).toBe("/llms.txt");
		});

		test("should handle llms.txt path correctly", async () => {
			const request = new Request("http://localhost/llms.txt");

			const response = await app.fetch(request, mockEnv, mockCtx);
			const text = await response.text();

			expect(response.status).toBe(200);
			expect(text).toContain("Duyet MCP Server");
			expect(text).toContain("duyet-mcp-server");
		});

		test("should handle favicon redirect", async () => {
			const request = new Request("http://localhost/favicon.ico");

			const response = await app.fetch(request, mockEnv, mockCtx);

			expect(response.status).toBe(302);
			expect(response.headers.get("Location")).toBe("https://blog.duyet.net/icon.svg");
		});

		test("should handle 404 for invalid paths", async () => {
			const request = new Request("http://localhost/invalid-path");

			const response = await app.fetch(request, mockEnv, mockCtx);

			expect(response.status).toBe(404);
		});
	});
});
