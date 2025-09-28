import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCVData, type CVFormat } from "../core/cv.js";

// Define schema separately to avoid TypeScript inference issues with Zod version differences
const formatSchema = z.enum(["summary", "detailed", "json"]).default("summary") as any;

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
				format: formatSchema.describe("Format of CV data to return"),
			},
		},
		async ({ format = "summary" }) => {
			try {
				const cvData = await getCVData(format as CVFormat);

				return {
					content: [
						{
							type: "text",
							text: cvData.content,
						},
					],
				};
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				return {
					content: [
						{
							type: "text",
							text: `Error fetching CV: ${errorMessage}

You can still access the CV directly at: https://duyet.net/cv`,
						},
					],
				};
			}
		},
	);
}
