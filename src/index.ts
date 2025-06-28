import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Hono } from "hono";

import { registerAllTools } from "./tools/index";
import { registerAllResources } from "./resources/index";

export class DuyetMCP extends McpAgent {
	server = new McpServer({
		name: "Duyet MCP Server",
		version: "0.1.0",
	});

	async init() {
		// Register all MCP tools and resources - env should be available through this.env
		registerAllTools(this.server, this.env as Env);
		registerAllResources(this.server, this.env as Env);
	}
}

const app = new Hono<{ Bindings: Env }>();

const LLMS_TXT = `Duyet MCP Server. See https://github.com/duyet/duyet-mcp-server for more details.

Usage: Update your AI assistant configuration to point to the URL of Duyet MCP server

\`\`\`
{
  "mcpServers": {
    "duyet-mcp-server": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp.duyet.net/sse"
      ]
    }
  }
}
\`\`\`
  `;

app.get("/", (c) => c.redirect("/llms.txt"));
app.get("/llms.txt", (c) => c.text(LLMS_TXT));
app.get("/favicon.ico", (c) => c.redirect("https://blog.duyet.net/icon.svg"));


app.mount('/sse', DuyetMCP.serveSSE('/sse').fetch, { replaceRequest: false })
app.mount('/mcp', DuyetMCP.serve('/mcp').fetch, { replaceRequest: false })


export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		try {
			if (request.headers.get("Upgrade") === "websocket") {
				const mcpApp = DuyetMCP.serve("/mcp");
				return mcpApp.fetch(request, env, ctx);
			}
			return app.fetch(request, env, ctx);
		} catch (error) {
			console.error("Application Error:", error);
			return new Response("Internal Server Error", { status: 500 });
		}
	},
};
