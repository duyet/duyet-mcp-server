/**
 * Core business logic layer for MCP server
 * This layer contains pure business logic that can be used by both resources and tools
 */

// Export types
export type {
	AboutDuyetData,
	CVData,
	CVFormat,
	BlogPostData,
	BlogPostsData,
	GitHubActivityData,
	GitHubActivityItem,
	CoreError,
} from "./types.js";

// Export about functions
export {
	getAboutDuyetData,
	calculateYearsOfExperience,
	getAboutDuyetContent,
} from "./about.js";

// Export CV functions
export { getCVData } from "./cv.js";

// Export blog functions
export {
	getBlogPostsData,
	fetchAndParseRSS,
	parseRSSContent,
	extractBlogPostFromItem,
	extractFieldFromElement,
	formatBlogPostsForMCP,
	formatBlogPostsForTool,
} from "./blog.js";

// Export GitHub functions
export {
	getGitHubActivityData,
	formatGitHubEvent,
	formatGitHubActivityForDisplay,
} from "./github.js";

// Export cache functions
export { globalCache, cachedFetch } from "./cache.js";

// Export llms.txt functions
export type { LLMsTxtData } from "./llms-txt.js";
export { fetchLLMsTxt, parseLLMsTxt, getDuyetLLMsTxt } from "./llms-txt.js";

// Export career functions
export type { CareerPreferences } from "./career.js";
export {
	getCareerPreferences,
	formatCareerPreferences,
	answerHRQuestion,
} from "./career.js";
