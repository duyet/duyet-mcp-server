import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGitHubActivityData, formatGitHubActivityForDisplay } from "../core/github.js";

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
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: true,
			},
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
			outputSchema: {
				activities: z.array(
					z.object({
						type: z.string(),
						action: z.string(),
						repository: z.string(),
						date: z.string(),
						details: z.string().optional(),
					}),
				),
				totalRetrieved: z.number(),
				profileUrl: z.string(),
				username: z.string(),
			},
		},
		async ({ limit = 5, include_details = false }) => {
			try {
				const data = await getGitHubActivityData(limit, include_details);
				const formattedContent = formatGitHubActivityForDisplay(data);

				return {
					structuredContent: {
						activities: data.activities,
						totalRetrieved: data.totalRetrieved,
						profileUrl: data.profileUrl,
						username: data.username,
					},
					content: [
						{
							type: "text" as const,
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
							type: "text" as const,
							text: errorContent,
						},
					],
				};
			}
		},
	);
}
