import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Register the CV resource with format parameter
 */
export function registerCVResource(server: McpServer) {
	server.registerResource(
		"cv",
		new ResourceTemplate("duyet://cv/{format}", {
			list: undefined,
			complete: {
				format: (value: string) => {
					return ["summary", "detailed", "json"].filter((f) => f.startsWith(value));
				},
			},
		}),
		{
			title: "Duyet's CV",
			description:
				"Duyet's curriculum vitae in different formats - summary, detailed, or JSON",
			mimeType: "text/plain",
		},
		async (uri: URL, { format = "summary" }: { format?: string }) => {
			try {
				const response = await fetch("https://duyet.net/cv");

				if (!response.ok) {
					throw new Error(`Failed to fetch CV: ${response.status}`);
				}

				if (format === "json") {
					try {
						const jsonResponse = await fetch("https://duyet.net/cv.json");
						if (jsonResponse.ok) {
							const cvData = await jsonResponse.text();
							return {
								contents: [
									{
										uri: uri.href,
										text: `CV Data (JSON format):\n\`\`\`json\n${cvData}\n\`\`\``,
										mimeType: "application/json",
									},
								],
							};
						}
					} catch {
						// Fallback to summary if JSON not available
					}
				}

				const htmlContent = await response.text();

				const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)</i);
				const title = titleMatch ? titleMatch[1] : "Duyet's CV";

				if (format === "detailed") {
					const content = `${title}

Full CV available at: https://duyet.net/cv

Key Highlights:
- Sr. Data Engineer with ${new Date().getFullYear() - 2017}+ years of experience
- Expert in Data Engineering, Cloud Technologies, and modern data stack
- Strong background in Rust, Python, and distributed systems
- Experience with ClickHouse, Kafka, Kubernetes, and cloud platforms
- Open source contributor and technical blogger

For the most up-to-date and complete CV, please visit: https://duyet.net/cv`;

					return {
						contents: [
							{
								uri: uri.href,
								text: content,
							},
						],
					};
				}

				// Summary format (default)
				const content = `${title}

CV Link: https://duyet.net/cv
Sr. Data Engineer with ${new Date().getFullYear() - 2017}+ years of experience
Expertise: Data Engineering, Cloud Technologies, Distributed Systems
Specialties: ClickHouse, Kafka, Kubernetes, Rust, Python
Technical blogger at https://blog.duyet.net

For detailed experience, education, and projects, visit the full CV at: https://duyet.net/cv`;

				return {
					contents: [
						{
							uri: uri.href,
							text: content,
						},
					],
				};
			} catch (error) {
				const errorContent = `Error fetching CV: ${error instanceof Error ? error.message : "Unknown error"}

You can still access the CV directly at: https://duyet.net/cv`;

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
