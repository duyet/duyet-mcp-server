// Mock the agents/mcp module to avoid Cloudflare Workers runtime dependencies in Bun tests
import { mock } from "bun:test";

export class McpAgent {
	ctx: unknown;
	env: unknown;
	server: {
		tool: ReturnType<typeof mock>;
		registerTool: ReturnType<typeof mock>;
		registerResource: ReturnType<typeof mock>;
		registerPrompt: ReturnType<typeof mock>;
	};

	constructor(ctx: unknown, env: unknown) {
		this.ctx = ctx;
		this.env = env;
		this.server = {
			tool: mock(() => undefined),
			registerTool: mock(() => undefined),
			registerResource: mock(() => undefined),
			registerPrompt: mock(() => undefined),
		};
	}

	async init() {}

	static serve = mock(() => ({
		fetch: mock(() => new Response("OK")),
	}));

	static serveSSE = mock(() => ({
		fetch: mock(() => new Response("OK")),
	}));

	static mount = mock(() => ({
		fetch: mock(() => new Response("OK")),
	}));
}
