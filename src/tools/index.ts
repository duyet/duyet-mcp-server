import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { logger } from "../utils/logger";

// Content tools
import { registerGitHubActivityTool } from "./github-activity";
import { registerGetBlogPostContentTool } from "./blog-posts";

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
	logger.info("init", "Registering MCP tools");

	// Content tools
	registerGitHubActivityTool(server);
	logger.tool("github_activity", "registered");
	registerGetBlogPostContentTool(server);
	logger.tool("get_blog_post_content", "registered");

	// Interaction tools
	registerSendMessageTool(server, env);
	logger.tool("send_message", "registered");
	registerHireMeTool(server, env);
	logger.tool("hire_me", "registered");
	registerSayHiTool(server);
	logger.tool("say_hi", "registered");

	// Management tools
	registerGetAnalyticsTool(server, env);
	logger.tool("get_analytics", "registered");

	logger.info("init", "All MCP tools registered", { count: 6 });
}

// Export individual tool registration functions for selective use
export {
	// Content tools
	registerGitHubActivityTool,
	registerGetBlogPostContentTool,
	// Interaction tools
	registerSendMessageTool,
	registerHireMeTool,
	registerSayHiTool,
	// Management tools
	registerGetAnalyticsTool,
};
