import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { logger } from "../utils/logger";

import { registerAboutDuyetResource } from "./about-duyet";
import { registerCVResource } from "./cv";
import { registerBlogPostsResource } from "./blog-posts";
import { registerGitHubActivityResource } from "./github-activity";
import { registerLlmsTxtResource } from "./llms-txt";
import { registerProjectsResource } from "./projects";

/**
 * Register all MCP resources with the server
 */
export function registerAllResources(server: McpServer, _env: Env) {
	logger.debug("init", "Registering MCP resources");

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
	registerProjectsResource(server);
	logger.resource("projects", "registered");

	logger.debug("init", "All MCP resources registered", { count: 6 });
}

// Export individual resource registration functions for selective use
export {
	registerAboutDuyetResource,
	registerCVResource,
	registerBlogPostsResource,
	registerGitHubActivityResource,
	registerLlmsTxtResource,
	registerProjectsResource,
};
