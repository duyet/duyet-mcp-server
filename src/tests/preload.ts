// Preload file for Bun tests - mocks cloudflare-specific modules
import { mock } from "bun:test";

// Mock the agents/mcp module to avoid cloudflare:email dependency
mock.module("agents/mcp", () => ({
	McpAgent: class MockMcpAgent {
		ctx: unknown;
		env: unknown;
		server = {
			tool: () => undefined,
			registerTool: () => undefined,
			registerResource: () => undefined,
			registerPrompt: () => undefined,
		};
		constructor(ctx: unknown, env: unknown) {
			this.ctx = ctx;
			this.env = env;
		}
		async init() {}
		static serve = () => ({
			fetch: () => new Response("OK"),
		});
		static serveSSE = () => ({
			fetch: () => new Response("OK"),
		});
	},
}));
