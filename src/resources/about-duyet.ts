import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAboutDuyetData } from "../core/about.js";

/**
 * Register the about-duyet resource
 */
export function registerAboutDuyetResource(server: McpServer) {
	server.registerResource(
		"about-duyet",
		"duyet://about",
		{
			title: "About Duyet",
			description:
				"Basic information about Duyet, a Senior Data Engineer with extensive experience in data engineering, cloud technologies, and distributed systems",
			mimeType: "text/plain",
		},
		async (uri: URL) => {
			try {
				const data = getAboutDuyetData();

				return {
					contents: [
						{
							uri: uri.href,
							text: data.content,
						},
					],
				};
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				return {
					contents: [
						{
							uri: uri.href,
							text: `Error loading about information: ${errorMessage}`,
						},
					],
				};
			}
		},
	);
}
