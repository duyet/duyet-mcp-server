import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { toFetchResponse, toReqRes } from "fetch-to-node";
import { Hono } from "hono";

import { registerAllTools } from "./tools/index";
import { registerAllResources } from "./resources/index";
import { registerAllPrompts } from "./prompts/index";
import { logger } from "./utils/logger";

/**
 * Create a fresh MCP server for a single request.
 * The server is stateless: no sessions, no Durable Objects.
 */
export function createMcpServer(env: Env): McpServer {
	const server = new McpServer({
		name: "Duyet MCP Server",
		version: "0.2.0",
	});

	registerAllTools(server, env);
	registerAllResources(server, env);
	registerAllPrompts(server);

	return server;
}

const app = new Hono<{ Bindings: Env }>();

const LLMS_TXT = `# Duyet MCP Server

Model Context Protocol (MCP) server that provides AI assistants with access to information about Duyet's work, projects, and blog content.

Repository: https://github.com/duyet/duyet-mcp-server
Deployed: https://duyet-mcp-server.duyet.workers.dev

## Connection

Streamable HTTP:

\`\`\`json
{
  "mcpServers": {
    "duyet-mcp-server": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.duyet.net/mcp"]
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

Tools are callable functions that perform actions or retrieve dynamic data. All tools include annotations (readOnlyHint, destructiveHint, idempotentHint, openWorldHint).

| Tool Name | Description |
|-----------|-------------|
| \`github_activity\` | Get recent GitHub activity including commits, issues, PRs, releases (structured output) |
| \`get_blog_post_content\` | Fetch full article content from a blog post URL |
| \`send_message\` | Send a message to Duyet (collaboration, job opportunities) |
| \`hire_me\` | Get information about hiring Duyet (full-time, contract, consulting) |
| \`say_hi\` | Send a friendly greeting to Duyet |
| \`get_analytics\` | Get contact submission analytics and reports |

## MCP Prompts (3)

Prompts are pre-built templates that clients can surface in their UI.

| Prompt Name | Description |
|-------------|-------------|
| \`introduce-duyet\` | Generate an introduction using profile and CV resources |
| \`review-blog\` | Fetch and summarize a blog post (arg: url) |
| \`hiring-inquiry\` | Tailored hiring information (args: role_type, tech_stack) |

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
app.get("/llms.txt", (c) => c.text(LLMS_TXT, 200, { "Cache-Control": "public, max-age=3600" }));
app.get("/favicon.ico", (c) => c.redirect("https://blog.duyet.net/icon.svg"));

// Stateless Streamable HTTP MCP endpoint: a fresh server + transport per request,
// no sessions, no Durable Objects.
app.post("/mcp", async (c) => {
	const { req, res } = toReqRes(c.req.raw);
	const server = createMcpServer(c.env);

	try {
		const transport = new StreamableHTTPServerTransport({
			sessionIdGenerator: undefined,
		});

		await server.connect(transport);
		await transport.handleRequest(req, res, await c.req.json());

		res.on("close", () => {
			transport.close();
			server.close();
		});

		return toFetchResponse(res);
	} catch (error) {
		logger.error("request", "MCP request failed", {
			error: error instanceof Error ? error.message : String(error),
		});
		return c.json(
			{
				jsonrpc: "2.0",
				error: { code: -32603, message: "Internal server error" },
				id: null,
			},
			500,
		);
	}
});

// Stateless mode has no server-initiated stream and no sessions to delete.
app.on(["GET", "DELETE"], "/mcp", (c) =>
	c.json(
		{
			jsonrpc: "2.0",
			error: { code: -32000, message: "Method not allowed" },
			id: null,
		},
		405,
	),
);

// Legacy SSE endpoint removed: SSE required a Durable Object held awake for the
// lifetime of every connection, which dominated Durable Objects billing.
app.all("/sse/*", (c) => c.text("The SSE endpoint has been removed. Use /mcp instead.", 410));
app.all("/sse", (c) => c.text("The SSE endpoint has been removed. Use /mcp instead.", 410));

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);
		logger.request(request.method, url.pathname, {
			headers: Object.fromEntries(request.headers),
		});

		try {
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
