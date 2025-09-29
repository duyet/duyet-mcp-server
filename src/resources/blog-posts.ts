import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getBlogPostsData, formatBlogPostsForMCP } from "../core/blog.js";

/**
 * Register the blog posts resource with limit parameter
 */
export function registerBlogPostsResource(server: McpServer) {
	server.registerResource(
		"blog-posts",
		new ResourceTemplate("duyet://blog/posts/{limit}", {
			list: undefined,
			complete: {
				limit: (value: string) => {
					const numbers = Array.from({ length: 10 }, (_, i) => String(i + 1));
					return numbers.filter((n) => n.startsWith(value));
				},
			},
		}),
		{
			title: "Duyet's Blog Posts",
			description: "Latest blog posts from Duyet's technical blog at blog.duyet.net",
			mimeType: "text/plain",
		},
		async (uri: URL, { limit = "1" }: { limit?: string }) => {
			try {
				const limitNum = Math.min(Math.max(Number.parseInt(limit, 10) || 1, 1), 10);
				const data = await getBlogPostsData(limitNum);

				if (data.posts.length === 0) {
					return {
						contents: [
							{
								uri: uri.href,
								text: "No blog posts found",
							},
						],
					};
				}

				const formattedContent = formatBlogPostsForMCP(data.posts);

				return {
					contents: [
						{
							uri: uri.href,
							text: formattedContent,
						},
					],
				};
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				return {
					contents: [
						{
							uri: uri.href,
							text: `Error fetching blog posts: ${errorMessage}`,
						},
					],
				};
			}
		},
	);
}
