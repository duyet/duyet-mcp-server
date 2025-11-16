import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Content tools
import { registerGitHubActivityTool } from "./github-activity";
import { registerGetBlogPostContentTool } from "./blog-posts";

// Web tools
import { registerWebSearchTool } from "./web-search";
import { registerWebFetchTool } from "./web-fetch";

// Interaction tools
import { registerSendMessageTool } from "./send-message";
import { registerHireMeTool } from "./hire-me";
import { registerSayHiTool } from "./say-hi";

// Management tools
import { registerGetAnalyticsTool } from "./contact-analytics";

/**
 * Register all MCP tools with the server
 */
export function registerAllTools(server: McpServer, env: Env) {
	// Content tools
	registerGitHubActivityTool(server);
	registerGetBlogPostContentTool(server);

	// Web tools
	registerWebSearchTool(server);
	registerWebFetchTool(server);

	// Interaction tools
	registerSendMessageTool(server, env);
	registerHireMeTool(server, env);
	registerSayHiTool(server);

	// Management tools
	registerGetAnalyticsTool(server, env);
}

// Export individual tool registration functions for selective use
export {
	// Content tools
	registerGitHubActivityTool,
	registerGetBlogPostContentTool,
	// Web tools
	registerWebSearchTool,
	registerWebFetchTool,
	// Interaction tools
	registerSendMessageTool,
	registerHireMeTool,
	registerSayHiTool,
	// Management tools
	registerGetAnalyticsTool,
};
