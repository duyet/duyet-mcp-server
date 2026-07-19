/**
 * Duyet's open source projects, fetched live from the GitHub API.
 */

import { cacheOrFetch, CACHE_CONFIGS } from "../utils/cache";
import { logger } from "../utils/logger";

export interface Project {
	name: string;
	description: string;
	url: string;
	stars: number;
	language: string;
	topics: string[];
}

interface GitHubRepo {
	name: string;
	description: string | null;
	html_url: string;
	stargazers_count: number;
	language: string | null;
	topics?: string[];
	fork: boolean;
	archived: boolean;
}

async function fetchProjects(limit: number): Promise<Project[]> {
	const response = await fetch(
		"https://api.github.com/users/duyet/repos?per_page=100&sort=updated",
		{
			headers: {
				Accept: "application/vnd.github+json",
				"User-Agent": "DuyetMCP/0.2 (+https://duyet.net)",
			},
		},
	);

	if (!response.ok) {
		throw new Error(`GitHub API returned ${response.status}`);
	}

	const repos = (await response.json()) as GitHubRepo[];

	return repos
		.filter((r) => !r.fork && !r.archived)
		.sort((a, b) => b.stargazers_count - a.stargazers_count)
		.slice(0, limit)
		.map((r) => ({
			name: r.name,
			description: r.description ?? "",
			url: r.html_url,
			stars: r.stargazers_count,
			language: r.language ?? "",
			topics: r.topics ?? [],
		}));
}

export async function getProjectsData(limit = 10): Promise<Project[]> {
	return cacheOrFetch(`projects-${limit}`, CACHE_CONFIGS.GITHUB, () => fetchProjects(limit));
}

export function formatProjectsForDisplay(projects: Project[]): string {
	const lines = projects.map(
		(p) =>
			`- **${p.name}** (⭐ ${p.stars}${p.language ? `, ${p.language}` : ""}) — ${p.description}\n  ${p.url}${p.topics.length ? `\n  Topics: ${p.topics.join(", ")}` : ""}`,
	);

	return `# Duyet's Open Source Projects & Products

Top projects by stars (live from GitHub):

${lines.join("\n")}

More: https://github.com/duyet?tab=repositories · https://duyet.net`;
}

export async function getProjectsDisplay(limit = 10): Promise<string> {
	try {
		const projects = await getProjectsData(limit);
		return formatProjectsForDisplay(projects);
	} catch (error) {
		logger.error("fetch", "Failed to fetch projects", {
			error: error instanceof Error ? error.message : String(error),
		});
		return "Error fetching projects. Browse directly: https://github.com/duyet?tab=repositories";
	}
}
