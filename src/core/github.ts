import { Octokit } from "@octokit/rest";
import type { RestEndpointMethodTypes } from "@octokit/rest";
import type { GitHubActivityData, GitHubActivityItem } from "./types.js";

type GitHubEvent =
	RestEndpointMethodTypes["activity"]["listPublicEventsForUser"]["response"]["data"][0];

/**
 * Format a single GitHub event into a structured activity item
 */
export function formatGitHubEvent(event: GitHubEvent, includeDetails = false): GitHubActivityItem {
	const date = new Date(event.created_at || new Date()).toLocaleDateString();
	const repository = event.repo?.name || "Unknown repository";

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

	return {
		type: event.type || "Unknown",
		action,
		repository,
		date,
		details: details || undefined,
	};
}

/**
 * Get GitHub activity data for Duyet
 */
export async function getGitHubActivityData(
	limit = 5,
	includeDetails = false,
): Promise<GitHubActivityData> {
	const username = "duyet";
	const profileUrl = `https://github.com/${username}`;
	const limitNum = Math.min(Math.max(limit, 1), 20);

	try {
		const octokit = new Octokit();

		const { data: events } = await octokit.rest.activity.listPublicEventsForUser({
			username,
			per_page: limitNum,
		});

		if (events.length === 0) {
			return {
				activities: [],
				totalRetrieved: 0,
				profileUrl,
				username,
			};
		}

		const activities = events.map((event) => formatGitHubEvent(event, includeDetails));

		return {
			activities,
			totalRetrieved: activities.length,
			profileUrl,
			username,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		throw new Error(`Error fetching GitHub activity: ${errorMessage}`);
	}
}

/**
 * Format GitHub activity data for display
 */
export function formatGitHubActivityForDisplay(data: GitHubActivityData): string {
	if (data.activities.length === 0) {
		return "No recent GitHub activity found.";
	}

	const activityList = data.activities
		.map(
			(activity) =>
				`${activity.action} in ${activity.repository} (${activity.date})${activity.details || ""}`,
		)
		.join("\n\n");

	return `Recent GitHub Activity for ${data.username}:

${activityList}

GitHub Profile: ${data.profileUrl}`;
}
