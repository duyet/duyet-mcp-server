import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGitHubActivityData, formatGitHubActivityForDisplay } from "../core/github.js";

/**
 * Register the get_github_activity MCP tool for compatibility with clients that don't support resources
 */
export function registerGetGitHubActivityTool(server: McpServer) {
	server.registerTool(
		"get_github_activity",
		{
			title: "Get GitHub Activity",
			description:
				"Get Duyet's recent GitHub activity including commits, issues, pull requests, releases, and other public events",
			inputSchema: {
				limit: z
					.number()
					.min(1)
					.max(20)
					.optional()
					.default(5)
					.describe("Number of recent activities to retrieve (1-20, default: 5)"),
				include_details: z
					.boolean()
					.optional()
					.default(false)
					.describe("Include detailed information like commit messages and issue titles"),
			},
		},
		async ({ limit = 5, include_details = false }) => {
			try {
				const data = await getGitHubActivityData(limit, include_details);
				const formattedContent = formatGitHubActivityForDisplay(data);

				return {
					content: [
						{
							type: "text",
							text: formattedContent,
						},
					],
				};
			} catch (error) {
				console.error("GitHub API error:", error);

				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				const errorContent = `Error fetching GitHub activity: ${errorMessage}

GitHub Profile: https://github.com/duyet`;

				return {
					content: [
						{
							type: "text",
							text: errorContent,
						},
					],
				};
			}
		},
	);
}
