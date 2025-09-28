import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getBlogPostsData, formatBlogPostsForTool } from "../core/blog.js";

// Define schemas separately to help with TypeScript inference
const limitSchema = z.number().min(1).max(20).optional().default(5) as any;
const urlSchema = z.string().url() as any;

/**
 * Register the get blog posts tool (replaces list_blog_posts)
 */
export function registerGetBlogPostsTool(server: McpServer) {
	server.registerTool(
		"get_blog_posts",
		{
			title: "Get Blog Posts",
			description: "Get a list of blog posts from blog.duyet.net in JSON format",
			inputSchema: {
				limit: limitSchema.describe("Number of blog posts to retrieve (1-20, default: 5)"),
			},
		},
		async ({ limit = 5 }) => {
			try {
				const data = await getBlogPostsData(limit);
				const formattedContent = formatBlogPostsForTool(data);

				return {
					content: [
						{
							type: "text",
							text: formattedContent,
						},
					],
				};
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									error: "Failed to fetch blog posts",
									message: errorMessage,
								},
								null,
								2,
							),
						},
					],
				};
			}
		},
	);
}

/**
 * Register the list blog posts tool (legacy alias for compatibility)
 */
export function registerListBlogPostTool(server: McpServer) {
	server.registerTool(
		"list_blog_posts",
		{
			title: "List Blog Posts",
			description: "Get a list of blog posts from blog.duyet.net in JSON format (legacy alias for get_blog_posts)",
			inputSchema: {
				limit: limitSchema.describe("Number of blog posts to retrieve (1-20, default: 5)"),
			},
		},
		async ({ limit = 5 }) => {
			try {
				const data = await getBlogPostsData(limit);
				const formattedContent = formatBlogPostsForTool(data);

				return {
					content: [
						{
							type: "text",
							text: formattedContent,
						},
					],
				};
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									error: "Failed to fetch blog posts",
									message: errorMessage,
								},
								null,
								2,
							),
						},
					],
				};
			}
		},
	);
}

/**
 * Register the get blog post content tool
 */
export function registerGetBlogPostContentTool(server: McpServer) {
	server.registerTool(
		"get_blog_post_content",
		{
			title: "Get Blog Post Content",
			description: "Get the full content of a specific blog post by URL",
			inputSchema: {
				url: urlSchema.describe("The URL of the blog post to retrieve content from"),
			},
		},
		async ({ url }) => {
			try {
				// Validate that it's a blog.duyet.net URL for security
				const blogUrl = new URL(url);
				if (blogUrl.hostname !== "blog.duyet.net") {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										error: "Invalid URL",
										message: "Only blog.duyet.net URLs are supported",
									},
									null,
									2,
								),
							},
						],
					};
				}

				const response = await fetch(url);
				if (!response.ok) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										error: "Failed to fetch blog post",
										message: `HTTP ${response.status}: ${response.statusText}`,
									},
									null,
									2,
								),
							},
						],
					};
				}

				const htmlContent = await response.text();

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									url,
									content: htmlContent,
									contentType:
										response.headers.get("content-type") || "text/html",
									contentLength: htmlContent.length,
								},
								null,
								2,
							),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									error: "Failed to retrieve blog post content",
									message:
										error instanceof Error ? error.message : "Unknown error",
								},
								null,
								2,
							),
						},
					],
				};
			}
		},
	);
}
