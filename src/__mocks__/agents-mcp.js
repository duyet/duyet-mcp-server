// Mock the agents/mcp module to avoid Cloudflare Workers runtime dependencies in Jest
export class McpAgent {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.server = {
      tool: jest.fn(),
      registerTool: jest.fn(),
      registerResource: jest.fn(),
      registerPrompt: jest.fn(),
    };
  }

  async init() {}

  static serve = jest.fn().mockReturnValue({
    fetch: jest.fn(),
  });

  static serveSSE = jest.fn().mockReturnValue({
    fetch: jest.fn(),
  });

  static mount = jest.fn().mockReturnValue({
    fetch: jest.fn(),
  });
}