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
export { getAboutDuyetData, calculateYearsOfExperience } from "./about.js";

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
