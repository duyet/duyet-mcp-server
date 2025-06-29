import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Core information tools
import { registerGetCVTool } from "./get-cv";

// Content tools
import { registerGitHubActivityTool } from "./github-activity";
import { registerListBlogPostTool, registerGetBlogPostContentTool } from "./blog-posts";

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
	// Core information tools
	registerGetCVTool(server);

	// Content tools
	registerGitHubActivityTool(server);
	registerListBlogPostTool(server);
	registerGetBlogPostContentTool(server);

	// Interaction tools
	registerSendMessageTool(server, env);
	registerHireMeTool(server, env);
	registerSayHiTool(server);

	// Management tools
	registerGetAnalyticsTool(server, env);
}

// Export individual tool registration functions for selective use
export {
	// Core information tools
	registerGetCVTool,
	// Content tools
	registerGitHubActivityTool,
	registerListBlogPostTool,
	registerGetBlogPostContentTool,
	// Interaction tools
	registerSendMessageTool,
	registerHireMeTool,
	registerSayHiTool,
	// Management tools
	registerGetAnalyticsTool,
};
