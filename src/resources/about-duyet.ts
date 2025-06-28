import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { calculateYearsOfExperience, getAboutDuyetContent } from "../tools/about-duyet";

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
			const yearsOfExperience = calculateYearsOfExperience();
			const content = getAboutDuyetContent(yearsOfExperience);

			return {
				contents: [
					{
						uri: uri.href,
						text: content.trim(),
					},
				],
			};
		},
	);
}
