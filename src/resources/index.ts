import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { logger } from "../utils/logger";

import { registerAboutDuyetResource } from "./about-duyet";
import { registerCVResource } from "./cv";
import { registerBlogPostsResource } from "./blog-posts";
import { registerGitHubActivityResource } from "./github-activity";
import { registerLlmsTxtResource } from "./llms-txt";

/**
 * Register all MCP resources with the server
 */
export function registerAllResources(server: McpServer, _env: Env) {
	logger.info("init", "Registering MCP resources");

	// Core information resources
	registerAboutDuyetResource(server);
	logger.resource("about-duyet", "registered");
	registerCVResource(server);
	logger.resource("cv", "registered");

	// Content resources
	registerBlogPostsResource(server);
	logger.resource("blog-posts", "registered");
	registerGitHubActivityResource(server);
	logger.resource("github-activity", "registered");
	registerLlmsTxtResource(server);
	logger.resource("llms-txt", "registered");

	logger.info("init", "All MCP resources registered", { count: 5 });
}

// Export individual resource registration functions for selective use
export {
	registerAboutDuyetResource,
	registerCVResource,
	registerBlogPostsResource,
	registerGitHubActivityResource,
	registerLlmsTxtResource,
};
