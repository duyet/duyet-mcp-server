import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCVData, type CVFormat } from "../core/cv.js";

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
				const cvData = await getCVData(format as CVFormat);

				return {
					contents: [
						{
							uri: uri.href,
							text: cvData.content,
							mimeType: cvData.isJsonFormat ? "application/json" : "text/plain",
						},
					],
				};
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				return {
					contents: [
						{
							uri: uri.href,
							text: `Error fetching CV: ${errorMessage}

You can still access the CV directly at: https://duyet.net/cv`,
						},
					],
				};
			}
		},
	);
}
