import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAboutDuyetData } from "../core/about.js";

/**
 * Register the get_about_duyet MCP tool for compatibility with clients that don't support resources
 */
export function registerGetAboutDuyetTool(server: McpServer) {
	server.registerTool(
		"get_about_duyet",
		{
			title: "Get About Duyet",
			description:
				"Get basic information about Duyet, a Senior Data Engineer with extensive experience in data engineering, cloud technologies, and distributed systems",
			inputSchema: {},
		},
		async () => {
			try {
				const data = getAboutDuyetData();

				return {
					content: [
						{
							type: "text",
							text: data.content,
						},
					],
				};
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				return {
					content: [
						{
							type: "text",
							text: `Error loading about information: ${errorMessage}`,
						},
					],
				};
			}
		},
	);
}
