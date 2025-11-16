import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchBlogPostContent } from "../core/blog.js";

// Define schema for URL validation
const urlSchema = z.string().url() as any;

/**
 * Register the get blog post content tool
 */
export function registerGetBlogPostContentTool(server: McpServer) {
	server.registerTool(
		"get_blog_post_content",
		{
			title: "Get Blog Post Content",
			description:
				"Get the full content of a specific blog post by URL. Extracts article text, title, and metadata (author, publish date, tags) from blog.duyet.net or duyet.net posts.",
			inputSchema: {
				url: urlSchema.describe(
					"The URL of the blog post to retrieve content from (blog.duyet.net or duyet.net)",
				),
			},
		},
		async ({ url }) => {
			try {
				const result = await fetchBlogPostContent(url);

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									url: result.url,
									title: result.title,
									content: result.content,
									metadata: result.metadata,
									contentLength: result.contentLength,
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
									message: error instanceof Error ? error.message : "Unknown error",
								},
								null,
								2,
							),
						},
					],
					isError: true,
				};
			}
		},
	);
}
