import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerAboutDuyetResource } from "./about-duyet";
import { registerCVResource } from "./cv";
import { registerBlogPostsResource } from "./blog-posts";
import { registerGitHubActivityResource } from "./github-activity";
import { registerHireMeResource } from "./hire-me";
import { registerContactsResource } from "./contacts";

/**
 * Register all MCP resources with the server
 */
export function registerAllResources(server: McpServer, env: Env) {
	// Core information resources
	registerAboutDuyetResource(server);
	registerCVResource(server);

	// Content resources
	registerBlogPostsResource(server);
	registerGitHubActivityResource(server);

	// Interaction resources
	registerHireMeResource(server);

	// Management resources (require database access)
	registerContactsResource(server, env);
}

// Export individual resource registration functions for selective use
export {
	registerAboutDuyetResource,
	registerCVResource,
	registerBlogPostsResource,
	registerGitHubActivityResource,
	registerHireMeResource,
	registerContactsResource,
};
