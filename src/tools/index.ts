import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Core information tools
import { registerGetAboutDuyetTool } from "./get-about-duyet";
import { registerGetCVTool } from "./get-cv";

// Content tools
import { registerGitHubActivityTool } from "./github-activity";
import { registerGetGitHubActivityTool } from "./get-github-activity";
import { registerGetBlogPostsTool, registerListBlogPostTool, registerGetBlogPostContentTool } from "./blog-posts";

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
	// Core information tools (matching resources for compatibility)
	registerGetAboutDuyetTool(server);
	registerGetCVTool(server);

	// Content tools
	registerGitHubActivityTool(server);
	registerGetGitHubActivityTool(server);
	registerGetBlogPostsTool(server);
	registerListBlogPostTool(server); // Legacy alias for compatibility
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
	registerGetAboutDuyetTool,
	registerGetCVTool,
	// Content tools
	registerGitHubActivityTool,
	registerGetGitHubActivityTool,
	registerGetBlogPostsTool,
	registerListBlogPostTool,
	registerGetBlogPostContentTool,
	// Interaction tools
	registerSendMessageTool,
	registerHireMeTool,
	registerSayHiTool,
	// Management tools
	registerGetAnalyticsTool,
};
