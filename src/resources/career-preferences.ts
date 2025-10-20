import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCareerPreferences, formatCareerPreferences } from "../core/career.js";

/**
 * Register the career preferences resource
 * Useful for recruiters and HR professionals
 */
export function registerCareerPreferencesResource(server: McpServer) {
	server.registerResource(
		"career-preferences",
		"duyet://career/preferences",
		{
			title: "Career Preferences",
			description:
				"Duyet's career preferences, salary expectations, work arrangement requirements, and hiring criteria for recruiters",
			mimeType: "text/markdown",
		},
		async (uri: URL) => {
			try {
				const prefs = getCareerPreferences();
				const formatted = formatCareerPreferences(prefs);

				return {
					contents: [
						{
							uri: uri.href,
							text: formatted,
							mimeType: "text/markdown",
						},
					],
				};
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				return {
					contents: [
						{
							uri: uri.href,
							text: `Error fetching career preferences: ${errorMessage}`,
						},
					],
				};
			}
		},
	);
}
