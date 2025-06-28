import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register the get_cv MCP tool
 */
export function registerGetCVTool(server: McpServer) {
	server.registerTool(
		"get_cv",
		{
			title: "Get CV",
			description:
				"Retrieve Duyet's CV (curriculum vitae) in different formats - summary, detailed, or JSON format",
			inputSchema: {
				format: z
					.enum(["summary", "detailed", "json"])
					.default("summary")
					.describe("Format of CV data to return"),
			},
		},
		async ({ format = "summary" }) => {
			try {
				const response = await fetch("https://duyet.net/cv");

				if (!response.ok) {
					throw new Error(`Failed to fetch CV: ${response.status}`);
				}

				if (format === "json") {
					// Try to fetch structured CV data (if available as JSON)
					try {
						const jsonResponse = await fetch("https://duyet.net/cv.json");
						if (jsonResponse.ok) {
							const cvData = await jsonResponse.text();
							return {
								content: [
									{
										type: "text",
										text: `CV Data (JSON format):\n\`\`\`json\n${cvData}\n\`\`\``,
									},
								],
							};
						}
					} catch {
						// Fallback to summary if JSON not available
					}
				}

				const htmlContent = await response.text();

				// Extract key information from HTML (basic parsing)
				const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)</i);
				const title = titleMatch ? titleMatch[1] : "Duyet's CV";

				if (format === "detailed") {
					// Return more detailed content
					return {
						content: [
							{
								type: "text",
								text: `${title}

Full CV available at: https://duyet.net/cv

Key Highlights:
- Sr. Data Engineer with ${new Date().getFullYear() - 2017}+ years of experience
- Expert in Data Engineering, Cloud Technologies, and modern data stack
- Strong background in Rust, Python, and distributed systems
- Experience with ClickHouse, Kafka, Kubernetes, and cloud platforms
- Open source contributor and technical blogger

For the most up-to-date and complete CV, please visit: https://duyet.net/cv`,
							},
						],
					};
				}

				// Summary format (default)
				return {
					content: [
						{
							type: "text",
							text: `${title}

CV Link: https://duyet.net/cv
Sr. Data Engineer with ${new Date().getFullYear() - 2017}+ years of experience
Expertise: Data Engineering, Cloud Technologies, Distributed Systems
Specialties: ClickHouse, Kafka, Kubernetes, Rust, Python
Technical blogger at https://blog.duyet.net

For detailed experience, education, and projects, visit the full CV at: https://duyet.net/cv`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error fetching CV: ${error instanceof Error ? error.message : "Unknown error"}

You can still access the CV directly at: https://duyet.net/cv`,
						},
					],
				};
			}
		},
	);
}
