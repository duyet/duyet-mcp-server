import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Hono } from "hono";
import { registerAllTools } from "./tools/index";

export class DuyetMCP extends McpAgent {
	server = new McpServer({
		name: "Duyet MCP Server",
		version: "0.1.0",
	});

	async init() {
		// Register all MCP tools - env should be available through this.env
		registerAllTools(this.server, this.env as Env);
	}
}

const app = new Hono<{ Bindings: Env }>();

const HOME_PAGE_CONTENT = `Duyet MCP Server. See https://github.com/duyet/duyet-mcp-server for more details.

Usage: Update your AI assistant configuration to point to the URL of Duyet MCP server

\`\`\`
{
  "mcpServers": {
    "duyet-mcp-server": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://duyet-mcp-server.duyet.workers.dev/sse"
      ]
    }
  }
}
\`\`\`
  `;

app.get("/", (c) => c.text(HOME_PAGE_CONTENT));
app.get("/favicon.ico", (c) => c.redirect("https://blog.duyet.net/icon.svg"));

// Create MCP routes with environment handling
app.all("/sse/*", async (c) => {
	const mcpApp = DuyetMCP.serveSSE("/sse");
	return mcpApp.fetch(c.req.raw, c.env, c.executionCtx);
});

app.all("/mcp*", async (c) => {
	const mcpApp = DuyetMCP.serve("/mcp");
	return mcpApp.fetch(c.req.raw, c.env, c.executionCtx);
});

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		if (request.headers.get("Upgrade") === "websocket") {
			const mcpApp = DuyetMCP.serve("/mcp");
			return mcpApp.fetch(request, env, ctx);
		}
		return app.fetch(request, env, ctx);
	},
};
