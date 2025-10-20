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

import { getDuyetLLMsTxt } from "./core/llms-txt";

// Dynamic llms.txt endpoint with fallback
app.get("/", (c) => c.redirect("/llms.txt"));
app.get("/llms.txt", async (c) => {
	try {
		const data = await getDuyetLLMsTxt();
		return c.text(data.raw, 200, {
			"Content-Type": "text/markdown; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		});
	} catch (error) {
		// Fallback content if blog.duyet.net/llms.txt is unavailable
		const fallback = `# Duyet MCP Server

> MCP (Model Context Protocol) server providing AI assistants with access to Duyet's professional information, blog content, and career data.

## Features

- Personal information and CV access
- Blog posts and content
- GitHub activity tracking
- Career preferences and HR tools
- Job description submission and matching

## Usage

Update your AI assistant configuration to point to the Duyet MCP server:

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

## Resources

- GitHub: https://github.com/duyet/duyet-mcp-server
- Blog: https://blog.duyet.net
- Website: https://duyet.net

## MCP Resources Available

- \`duyet://about\` - Profile information
- \`duyet://cv/{format}\` - CV (summary/detailed/json)
- \`duyet://career/preferences\` - Career preferences for recruiters
- \`duyet://blog/posts/{limit}\` - Blog posts
- \`duyet://github-activity\` - GitHub activity
- \`duyet://llms.txt\` - This file from blog.duyet.net

## MCP Tools Available

**Core Information:**
- \`get-about-duyet\` - Get profile information
- \`get-cv\` - Retrieve CV in various formats

**Content:**
- \`get-blog-posts\` - Get latest blog posts
- \`get-blog-post-content\` - Get full post content
- \`github-activity\` - Get GitHub activity

**HR/Recruiter Tools:**
- \`hr-quick-qa\` - Quick answers to common HR questions
- \`submit-job-description\` - Submit JD for review with matching
- \`hire-me\` - Get hiring information
- \`send-message\` - Contact for opportunities

**Interaction:**
- \`say-hi\` - Friendly greeting`;

		return c.text(fallback, 200, {
			"Content-Type": "text/markdown; charset=utf-8",
			"Cache-Control": "public, max-age=300",
		});
	}
});
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
