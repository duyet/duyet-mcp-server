import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGitHubActivityData, formatGitHubActivityForDisplay } from "../core/github.js";

// Define schemas separately to avoid TypeScript inference issues with Zod version differences
const limitSchema = z.number().min(1).max(20).optional().default(5) as any;
const includeDetailsSchema = z.boolean().optional().default(false) as any;

/**
 * Register the GitHub activity tool
 */
export function registerGitHubActivityTool(server: McpServer) {
	server.registerTool(
		"github_activity",
		{
			title: "GitHub Activity",
			description:
				"Get Duyet's recent GitHub activity including commits, issues, pull requests, releases, and other public events",
			inputSchema: {
				limit: limitSchema.describe(
					"Number of recent activities to retrieve (1-20, default: 5)",
				),
				include_details: includeDetailsSchema.describe(
					"Include detailed information like commit messages and issue titles",
				),
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
