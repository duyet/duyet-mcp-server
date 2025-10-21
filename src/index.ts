import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Hono } from "hono";

import { registerAllTools } from "./tools/index";
import { registerAllResources } from "./resources/index";
import { calculateYearsOfExperience } from "./core/about";

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

/**
 * Generate dynamic llms.txt content with current information about Duyet
 */
function getLLMsTxt(): string {
	const yearsOfExperience = calculateYearsOfExperience();

	return `# Duyet - Data Engineer

## About

I'm Duyet, a Senior Data Engineer with ${yearsOfExperience}+ years of experience in building scalable data platforms and distributed systems. I am confident in my knowledge of Data Engineering concepts, best practices, and state-of-the-art data and Cloud technologies.

## Expertise

- Data Engineering & Data Platform Architecture
- Cloud Technologies (AWS, GCP, Azure)
- Distributed Systems (ClickHouse, Kafka, Kubernetes)
- Modern Data Stack & Data Pipeline Development
- Programming: Rust, Python, TypeScript
- Open Source Contributions & Technical Writing

## Links

- Website: https://duyet.net
- Blog: https://blog.duyet.net
- CV/Resume: https://duyet.net/cv
- GitHub: https://github.com/duyet
- LinkedIn: https://linkedin.com/in/duyet
- Email: me@duyet.net

## MCP Server

This is an experimental MCP (Model Context Protocol) server that helps AI assistants connect to and retrieve information about Duyet. The server provides access to information primarily available at https://duyet.net.

### Usage

Connect to the MCP server by updating your AI assistant configuration:

For Claude Desktop (using mcp-remote):
\`\`\`json
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

For Claude Code:
\`\`\`bash
claude mcp add --transport http duyet https://mcp.duyet.net/mcp
\`\`\`

### Endpoints

- SSE Endpoint: https://mcp.duyet.net/sse (recommended)
- MCP Endpoint: https://mcp.duyet.net/mcp

### Available Resources

Resources provide read-only access to information through URI-based requests:

- \`duyet://about\` - Basic information about Duyet
- \`duyet://cv/summary\` - Brief CV overview
- \`duyet://cv/detailed\` - Comprehensive CV information
- \`duyet://cv/json\` - Structured CV data
- \`duyet://blog/posts/{limit}\` - Latest blog posts (limit: 1-10)
- \`duyet://github-activity\` - Recent GitHub activity

### Available Tools

Tools provide interactive functionality with input parameters:

- \`send_message\` - Send a message to Duyet for collaboration, job opportunities, or inquiries
- \`get_cv\` - Retrieve Duyet's CV in different formats
- \`get_github_activity\` - Retrieve recent GitHub activity with details
- \`hire_me\` - Get information about hiring Duyet
- \`say_hi\` - Send a friendly greeting to Duyet
- \`contact_analytics\` - Generate analytics reports on contact submissions

## Source Code

GitHub: https://github.com/duyet/duyet-mcp-server
License: MIT

---
Last updated: ${new Date().toISOString().split("T")[0]}
`;
}

app.get("/", (c) => c.redirect("/llms.txt"));
app.get("/llms.txt", (c) => c.text(getLLMsTxt()));
app.get("/favicon.ico", (c) => c.redirect("https://blog.duyet.net/icon.svg"));

app.mount("/sse", DuyetMCP.serveSSE("/sse").fetch, { replaceRequest: false });
app.mount("/mcp", DuyetMCP.serve("/mcp").fetch, { replaceRequest: false });

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
