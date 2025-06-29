import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Octokit } from "@octokit/rest";
import type { RestEndpointMethodTypes } from "@octokit/rest";

type GitHubEvent = RestEndpointMethodTypes["activity"]["listPublicEventsForUser"]["response"]["data"][0];

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
				const limitNum = Math.min(Math.max(Number.parseInt(limit) || 5, 1), 20);
				const includeDetails = include_details === "true";

				const octokit = new Octokit();
				
				const { data: events } = await octokit.rest.activity.listPublicEventsForUser({
					username: "duyet",
					per_page: limitNum,
				});

				if (events.length === 0) {
					return {
						contents: [
							{
								uri: uri.href,
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
							if (includeDetails && payload?.commits) {
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
							if (includeDetails && payload?.issue) {
								details = `\n  - ${payload.issue.title}`;
							}
							break;
						}
						case "PullRequestEvent": {
							const payload = event.payload as any;
							const prAction = payload?.action || "updated";
							action = `${prAction} pull request`;
							if (includeDetails && payload?.pull_request) {
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
							if (includeDetails && payload?.release) {
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
					contents: [
						{
							uri: uri.href,
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