import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Hono } from "hono";

import { registerAllTools } from "./tools/index";
import { registerAllResources } from "./resources/index";
import { logger } from "./utils/logger";

export class DuyetMCP extends McpAgent {
	server = new McpServer({
		name: "Duyet MCP Server",
		version: "0.1.0",
	});

	async init() {
		logger.info("init", "Initializing DuyetMCP server");
		// Register all MCP tools and resources - env should be available through this.env
		registerAllTools(this.server, this.env as Env);
		registerAllResources(this.server, this.env as Env);
		logger.info("init", "DuyetMCP server initialized successfully");
	}
}

const app = new Hono<{ Bindings: Env }>();

const LLMS_TXT = `# Duyet MCP Server

Model Context Protocol (MCP) server that provides AI assistants with access to information about Duyet's work, projects, and blog content.

Repository: https://github.com/duyet/duyet-mcp-server
Deployed: https://duyet-mcp-server.duyet.workers.dev

## Connection

Update your AI assistant (e.g., Claude Desktop) configuration:

\`\`\`json
{
  "mcpServers": {
    "duyet-mcp-server": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.duyet.net/sse"]
    }
  }
}
\`\`\`

## MCP Resources (5)

Resources provide read-only data access. Automatically discoverable by MCP clients.

| Resource URI | Description |
|--------------|-------------|
| \`duyet://about\` | Profile information about Duyet Le - Senior Data Engineer |
| \`duyet://cv/{format}\` | CV/Resume with format options: summary, detailed, json |
| \`duyet://blog/posts/{limit}\` | Latest blog posts (1-10, default: 5) |
| \`duyet://github-activity\` | Recent GitHub activity (commits, PRs, issues) |
| \`duyet://blog/llms.txt\` | Comprehensive index of 296+ blog posts for LLM consumption |

## MCP Tools (6)

Tools are callable functions that perform actions or retrieve dynamic data.

| Tool Name | Description |
|-----------|-------------|
| \`github_activity\` | Get recent GitHub activity including commits, issues, PRs, releases |
| \`get_blog_post_content\` | Fetch full article content from a blog post URL |
| \`send_message\` | Send a message to Duyet (collaboration, job opportunities) |
| \`hire_me\` | Get information about hiring Duyet (full-time, contract, consulting) |
| \`say_hi\` | Send a friendly greeting to Duyet |
| \`get_analytics\` | Get contact submission analytics and reports |

## Blog Content

Access 296+ technical articles covering:
- Data Engineering (Apache Spark, ClickHouse, Airflow, DuckDB)
- Cloud Computing (AWS, GCP, Azure, Kubernetes)
- Programming (Rust, Python, JavaScript/TypeScript)
- Machine Learning & AI
- Software Engineering Best Practices

Blog: https://blog.duyet.net
llms.txt: https://blog.duyet.net/llms.txt

## Contact

- Email: me@duyet.net
- GitHub: https://github.com/duyet
- LinkedIn: https://linkedin.com/in/duyet
- Website: https://duyet.net
  `;

app.get("/", (c) => c.redirect("/llms.txt"));
app.get("/llms.txt", (c) => c.text(LLMS_TXT));
app.get("/favicon.ico", (c) => c.redirect("https://blog.duyet.net/icon.svg"));

app.mount("/sse", DuyetMCP.serveSSE("/sse").fetch, { replaceRequest: false });
app.mount("/mcp", DuyetMCP.serve("/mcp").fetch, { replaceRequest: false });

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);
		logger.request(request.method, url.pathname, {
			headers: Object.fromEntries(request.headers),
		});

		try {
			if (request.headers.get("Upgrade") === "websocket") {
				logger.debug("request", "WebSocket upgrade requested");
				const mcpApp = DuyetMCP.serve("/mcp");
				return mcpApp.fetch(request, env, ctx);
			}
			return app.fetch(request, env, ctx);
		} catch (error) {
			logger.error("request", "Application error", {
				error: error instanceof Error ? error.message : String(error),
				path: url.pathname,
			});
			return new Response("Internal Server Error", { status: 500 });
		}
	},
};
