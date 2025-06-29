import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "@octokit/rest";
import type { RestEndpointMethodTypes } from "@octokit/rest";

type GitHubEvent = RestEndpointMethodTypes["activity"]["listPublicEventsForUser"]["response"]["data"][0];

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
				const limitNum = Math.min(Math.max(limit, 1), 20);

				const octokit = new Octokit();
				
				const { data: events } = await octokit.rest.activity.listPublicEventsForUser({
					username: "duyet",
					per_page: limitNum,
				});

				if (events.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: "No recent GitHub activity found.",
							},
						],
					};
				}

				const formatActivity = (event: GitHubEvent) => {
					const date = new Date(event.created_at || new Date()).toLocaleDateString();
					const repo = event.repo?.name || "Unknown repository";

					let action = "";
					let details = "";

					switch (event.type) {
						case "PushEvent": {
							const payload = event.payload as any;
							const commits = payload?.commits?.length || 0;
							action = `Pushed ${commits} commit${commits > 1 ? "s" : ""}`;
							if (include_details && payload?.commits) {
								const commitMessages = payload.commits
									.slice(0, 3)
									.map((c: any) => `  - ${c.message}`)
									.join("\n");
								details = `\n${commitMessages}`;
							}
							break;
						}
						case "CreateEvent": {
							const payload = event.payload as any;
							const refType = payload?.ref_type || "repository";
							action = `Created ${refType}`;
							break;
						}
						case "IssuesEvent": {
							const payload = event.payload as any;
							const issueAction = payload?.action || "updated";
							action = `${issueAction} issue`;
							if (include_details && payload?.issue) {
								details = `\n  - ${payload.issue.title}`;
							}
							break;
						}
						case "PullRequestEvent": {
							const payload = event.payload as any;
							const prAction = payload?.action || "updated";
							action = `${prAction} pull request`;
							if (include_details && payload?.pull_request) {
								details = `\n  - ${payload.pull_request.title}`;
							}
							break;
						}
						case "WatchEvent":
							action = "Starred repository";
							break;
						case "ForkEvent":
							action = "Forked repository";
							break;
						case "ReleaseEvent": {
							const payload = event.payload as any;
							action = `${payload?.action || "created"} release`;
							if (include_details && payload?.release) {
								details = `\n  - ${payload.release.tag_name}: ${payload.release.name}`;
							}
							break;
						}
						default:
							action = `${(event.type || "Unknown").replace("Event", "")}`;
					}

					return `${action} in ${repo} (${date})${details}`;
				};

				const activityList = events.map(formatActivity).join("\n\n");

				const content = `Recent GitHub Activity for Duyet:

${activityList}

GitHub Profile: https://github.com/duyet`;

				return {
					content: [
						{
							type: "text",
							text: content,
						},
					],
				};
			} catch (error) {
				console.error("GitHub API error:", error);
				
				let errorMessage = "Unknown error";
				if (error instanceof Error) {
					errorMessage = error.message;
				}
				
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