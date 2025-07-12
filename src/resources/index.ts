import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerAboutDuyetResource } from "./about-duyet";
import { registerCVResource } from "./cv";
import { registerBlogPostsResource } from "./blog-posts";
import { registerGitHubActivityResource } from "./github-activity";

/**
 * Register all MCP resources with the server
 */
export function registerAllResources(server: McpServer, _env: Env) {
	// Core information resources
	registerAboutDuyetResource(server);
	registerCVResource(server);

	// Content resources
	registerBlogPostsResource(server);
	registerGitHubActivityResource(server);
}

// Export individual resource registration functions for selective use
export { 
	registerAboutDuyetResource, 
	registerCVResource, 
	registerBlogPostsResource,
	registerGitHubActivityResource 
};
