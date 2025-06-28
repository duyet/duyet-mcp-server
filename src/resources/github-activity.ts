import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

interface GitHubCommit {
	message: string;
	sha: string;
}

interface GitHubIssue {
	title: string;
	number: number;
	state: string;
}

interface GitHubPullRequest {
	title: string;
	number: number;
	state: string;
}

interface GitHubRelease {
	tag_name: string;
	name: string;
	published_at: string;
}

interface PushEventPayload {
	commits: GitHubCommit[];
	size: number;
}

interface CreateEventPayload {
	ref_type: string;
	ref?: string;
}

interface IssuesEventPayload {
	action: string;
	issue: GitHubIssue;
}

interface PullRequestEventPayload {
	action: string;
	pull_request: GitHubPullRequest;
}

interface ReleaseEventPayload {
	action: string;
	release: GitHubRelease;
}

type GitHubEventPayload =
	| PushEventPayload
	| CreateEventPayload
	| IssuesEventPayload
	| PullRequestEventPayload
	| ReleaseEventPayload
	| Record<string, unknown>;

interface GitHubEvent {
	type: string;
	created_at: string;
	repo: { name: string };
	payload?: GitHubEventPayload;
}

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

				const response = await fetch(
					`https://api.github.com/users/duyet/events/public?per_page=${limitNum}`,
				);

				if (!response.ok) {
					throw new Error(`GitHub API error: ${response.status}`);
				}

				const events: GitHubEvent[] = await response.json();

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
					const date = new Date(event.created_at).toLocaleDateString();
					const repo = event.repo.name;

					let action = "";
					let details = "";

					switch (event.type) {
						case "PushEvent": {
							const payload = event.payload as PushEventPayload;
							const commits = payload?.commits?.length || 0;
							action = `Pushed ${commits} commit${commits > 1 ? "s" : ""}`;
							if (includeDetails && payload?.commits) {
								const commitMessages = payload.commits
									.slice(0, 3)
									.map((c) => `  - ${c.message}`)
									.join("\n");
								details = `\n${commitMessages}`;
							}
							break;
						}
						case "CreateEvent": {
							const payload = event.payload as CreateEventPayload;
							const refType = payload?.ref_type || "repository";
							action = `Created ${refType}`;
							break;
						}
						case "IssuesEvent": {
							const payload = event.payload as IssuesEventPayload;
							const issueAction = payload?.action || "updated";
							action = `${issueAction} issue`;
							if (includeDetails && payload?.issue) {
								details = `\n  - ${payload.issue.title}`;
							}
							break;
						}
						case "PullRequestEvent": {
							const payload = event.payload as PullRequestEventPayload;
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
							const payload = event.payload as ReleaseEventPayload;
							action = `${payload?.action || "created"} release`;
							if (includeDetails && payload?.release) {
								details = `\n  - ${payload.release.tag_name}: ${payload.release.name}`;
							}
							break;
						}
						default:
							action = `${event.type.replace("Event", "")}`;
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
				const errorContent = `Error fetching GitHub activity: ${error instanceof Error ? error.message : "Unknown error"}

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




interface GitHubIssue {
	title: string;
	number: number;
	state: string;
}

interface GitHubPullRequest {
	title: string;
	number: number;
	state: string;
}

interface GitHubRelease {
	tag_name: string;
	name: string;
	published_at: string;
}

interface PushEventPayload {
	commits: GitHubCommit[];
	size: number;
}

interface CreateEventPayload {
	ref_type: string;
	ref?: string;
}

interface IssuesEventPayload {
	action: string;
	issue: GitHubIssue;
}

interface PullRequestEventPayload {
	action: string;
	pull_request: GitHubPullRequest;
}

interface ReleaseEventPayload {
	action: string;
	release: GitHubRelease;
}


/**
 * Register the get_github_activity MCP tool
 */
export function registerGitHubActivityTool(server: McpServer) {
	server.registerTool(
		"get_github_activity",
		{
			title: "Get GitHub Activity",
			description:
				"Retrieve Duyet's recent GitHub activity including commits, issues, pull requests, releases, and other public events. View up to 20 recent activities with optional detailed information",
			inputSchema: {
				limit: z
					.number()
					.min(1)
					.max(20)
					.default(5)
					.describe("Number of recent activities to fetch (1-20)"),
				include_details: z
					.boolean()
					.default(false)
					.describe("Include detailed information about activities"),
			},
		},
		async ({ limit = 5, include_details = false }) => {
			try {
				const response = await fetch(
					`https://api.github.com/users/duyet/events/public?per_page=${limit}`,
				);

				if (!response.ok) {
					throw new Error(`GitHub API error: ${response.status}`);
				}

				const events: GitHubEvent[] = await response.json();

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
					const date = new Date(event.created_at).toLocaleDateString();
					const repo = event.repo.name;

					let action = "";
					let details = "";

					switch (event.type) {
						case "PushEvent": {
							const payload = event.payload as PushEventPayload;
							const commits = payload?.commits?.length || 0;
							action = `Pushed ${commits} commit${commits > 1 ? "s" : ""}`;
							if (include_details && payload?.commits) {
								const commitMessages = payload.commits
									.slice(0, 3)
									.map((c) => `  - ${c.message}`)
									.join("\n");
								details = `\n${commitMessages}`;
							}
							break;
						}
						case "CreateEvent": {
							const payload = event.payload as CreateEventPayload;
							const refType = payload?.ref_type || "repository";
							action = `Created ${refType}`;
							break;
						}
						case "IssuesEvent": {
							const payload = event.payload as IssuesEventPayload;
							const issueAction = payload?.action || "updated";
							action = `${issueAction} issue`;
							if (include_details && payload?.issue) {
								details = `\n  - ${payload.issue.title}`;
							}
							break;
						}
						case "PullRequestEvent": {
							const payload = event.payload as PullRequestEventPayload;
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
							const payload = event.payload as ReleaseEventPayload;
							action = `${payload?.action || "created"} release`;
							if (include_details && payload?.release) {
								details = `\n  - ${payload.release.tag_name}: ${payload.release.name}`;
							}
							break;
						}
						default:
							action = `${event.type.replace("Event", "")}`;
					}

					return `${action} in ${repo} (${date})${details}`;
				};

				const activityList = events.map(formatActivity).join("\n\n");

				return {
					content: [
						{
							type: "text",
							text: `Recent GitHub Activity for Duyet:

${activityList}

GitHub Profile: https://github.com/duyet`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error fetching GitHub activity: ${error instanceof Error ? error.message : "Unknown error"}

GitHub Profile: https://github.com/duyet`,
						},
					],
				};
			}
		},
	);
}
