import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { logger } from "../utils/logger";

import { registerIntroduceDuyetPrompt } from "./introduce-duyet";
import { registerReviewBlogPrompt } from "./review-blog";
import { registerHiringInquiryPrompt } from "./hiring-inquiry";

/**
 * Register all MCP prompts with the server
 */
export function registerAllPrompts(server: McpServer) {
	logger.debug("init", "Registering MCP prompts");

	registerIntroduceDuyetPrompt(server);
	logger.debug("init", "Prompt registered: introduce-duyet");

	registerReviewBlogPrompt(server);
	logger.debug("init", "Prompt registered: review-blog");

	registerHiringInquiryPrompt(server);
	logger.debug("init", "Prompt registered: hiring-inquiry");

	logger.debug("init", "All MCP prompts registered", { count: 3 });
}

export { registerIntroduceDuyetPrompt, registerReviewBlogPrompt, registerHiringInquiryPrompt };
