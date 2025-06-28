import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Core information tools
import { registerAboutDuyetTool } from "./about-duyet";
import { registerGetCVTool } from "./get-cv";

// Content tools
import { registerGetLatestBlogPostTool } from "./get-latest-blog-post";
import { registerGitHubActivityTool } from "./github-activity";

// Interaction tools
import { registerContactTool } from "./contact";
import { registerHireMeTool } from "./hire-me";
import { registerSayHiTool } from "./say-hi";

// Management tools
import { registerGetContactsTool } from "./get-contacts";
import { registerContactAnalyticsTool } from "./contact-analytics";

/**
 * Register all MCP tools with the server
 */
export function registerAllTools(server: McpServer, env: Env) {
	// Core information tools
	registerAboutDuyetTool(server);
	registerGetCVTool(server);

	// Content tools
	registerGetLatestBlogPostTool(server);
	registerGitHubActivityTool(server);

	// Interaction tools
	registerContactTool(server, env);
	registerHireMeTool(server);
	registerSayHiTool(server);

	// Management tools
	registerGetContactsTool(server, env);
	registerContactAnalyticsTool(server, env);
}

// Export individual tool registration functions for selective use
export {
	// Core information tools
	registerAboutDuyetTool,
	registerGetCVTool,
	// Content tools
	registerGetLatestBlogPostTool,
	registerGitHubActivityTool,
	// Interaction tools
	registerContactTool,
	registerHireMeTool,
	registerSayHiTool,
	// Management tools
	registerGetContactsTool,
	registerContactAnalyticsTool,
};
