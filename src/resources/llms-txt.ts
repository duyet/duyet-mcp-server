import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getDuyetLLMsTxt } from "../core/llms-txt.js";

/**
 * Register the llms.txt resource
 * Provides dynamic content from blog.duyet.net/llms.txt
 */
export function registerLLMsTxtResource(server: McpServer) {
	server.registerResource(
		"llms-txt",
		"duyet://llms.txt",
		{
			title: "LLMs.txt",
			description:
				"AI-friendly site information from blog.duyet.net/llms.txt following the llms.txt specification",
			mimeType: "text/markdown",
		},
		async (uri: URL) => {
			try {
				const data = await getDuyetLLMsTxt();

				return {
					contents: [
						{
							uri: uri.href,
							text: data.raw,
							mimeType: "text/markdown",
						},
					],
				};
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				return {
					contents: [
						{
							uri: uri.href,
							text: `Error fetching llms.txt: ${errorMessage}

Fallback: Please visit https://blog.duyet.net/llms.txt directly.`,
						},
					],
				};
			}
		},
	);
}
