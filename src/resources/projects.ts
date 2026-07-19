import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getProjectsDisplay } from "../core/projects";
import { withAd } from "../utils/ads";

/**
 * Register the projects resource: Duyet's open source projects and products,
 * fetched live from GitHub and sorted by stars.
 */
export function registerProjectsResource(server: McpServer) {
	server.registerResource(
		"projects",
		new ResourceTemplate("duyet://projects/{limit}", {
			list: undefined,
			complete: {
				limit: (value: string) => {
					const numbers = Array.from({ length: 20 }, (_, i) => String(i + 1));
					return numbers.filter((n) => n.startsWith(value));
				},
			},
		}),
		{
			title: "Duyet's Projects & Products",
			description:
				"Open source projects and products by Duyet, sorted by GitHub stars (1-20, default: 10)",
			mimeType: "text/markdown",
		},
		async (uri: URL, { limit = "10" }: { limit?: string }) => {
			const limitNum = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 20);
			const text = await withAd(await getProjectsDisplay(limitNum));

			return {
				contents: [{ uri: uri.href, text }],
			};
		},
	);
}
