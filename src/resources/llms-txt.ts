import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchLlmsTxt } from "../core/blog.js";

/**
 * Register the llms.txt resource
 * llms.txt is a comprehensive markdown index of all blog posts for LLM consumption
 */
export function registerLlmsTxtResource(server: McpServer) {
	server.registerResource(
		"llms-txt",
		"duyet://blog/llms.txt",
		{
			title: "Duyet's Blog llms.txt",
			description:
				"Comprehensive markdown index of all blog posts from blog.duyet.net, designed for LLM consumption. Contains links and metadata for 296+ blog posts.",
			mimeType: "text/plain",
		},
		async (uri: URL) => {
			try {
				const content = await fetchLlmsTxt();

				return {
					contents: [
						{
							uri: uri.href,
							text: content,
						},
					],
				};
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				return {
					contents: [
						{
							uri: uri.href,
							text: `Error fetching llms.txt: ${errorMessage}`,
						},
					],
				};
			}
		},
	);
}
