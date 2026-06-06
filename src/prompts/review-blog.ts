import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register the "review-blog" prompt.
 * Takes a blog post URL and instructs the LLM to fetch and summarize it.
 */
export function registerReviewBlogPrompt(server: McpServer) {
	server.registerPrompt(
		"review-blog",
		{
			title: "Review Blog Post",
			description:
				"Fetch and summarize a blog post from blog.duyet.net. Provides a structured review with key takeaways.",
			argsSchema: {
				url: z
					.string()
					.url()
					.describe("URL of the blog post to review (blog.duyet.net or duyet.net)"),
			},
		},
		async ({ url }) => {
			return {
				messages: [
					{
						role: "user",
						content: {
							type: "text",
							text: `Please review the blog post at: ${url}

Use the \`get_blog_post_content\` tool to fetch the full article content.

Then provide a structured review:
1. **Title & Date** — the post title and when it was published
2. **Summary** — 2-3 sentence overview of what the post covers
3. **Key Takeaways** — bullet points of the most important insights
4. **Technical Topics** — technologies, tools, or concepts discussed
5. **Who Should Read This** — target audience for the post`,
						},
					},
				],
			};
		},
	);
}
