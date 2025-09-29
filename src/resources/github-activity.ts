import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGitHubActivityData, formatGitHubActivityForDisplay } from "../core/github.js";

/**
 * Register the GitHub activity resource with limit and details parameters
 */
export function registerGitHubActivityResource(server: McpServer) {
	server.registerResource(
		"github-activity",
		new ResourceTemplate("duyet://github/activity/{limit}/{include_details}", {
			list: undefined,
			complete: {
				limit: (value: string) => {
					const numbers = Array.from({ length: 20 }, (_, i) => String(i + 1));
					return numbers.filter((n) => n.startsWith(value));
				},
				include_details: (value: string) => {
					return ["true", "false"].filter((v) => v.startsWith(value));
				},
			},
		}),
		{
			title: "Duyet's GitHub Activity",
			description:
				"Recent GitHub activity including commits, issues, pull requests, releases, and other public events",
			mimeType: "text/plain",
		},
		async (
			uri: URL,
			{
				limit = "5",
				include_details = "false",
			}: { limit?: string; include_details?: string },
		) => {
			try {
				const limitNum = Math.min(Math.max(Number.parseInt(limit, 10) || 5, 1), 20);
				const includeDetails = include_details === "true";

				const data = await getGitHubActivityData(limitNum, includeDetails);
				const formattedContent = formatGitHubActivityForDisplay(data);

				return {
					contents: [
						{
							uri: uri.href,
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
					contents: [
						{
							uri: uri.href,
							text: errorContent,
						},
					],
				};
			}
		},
	);
}
