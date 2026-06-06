import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register the "hiring-inquiry" prompt.
 * Optional args for role type and tech stack to tailor the inquiry.
 */
export function registerHiringInquiryPrompt(server: McpServer) {
	server.registerPrompt(
		"hiring-inquiry",
		{
			title: "Hiring Inquiry",
			description:
				"Get tailored information about hiring Duyet. Optionally specify role type and tech stack for a more relevant response.",
			argsSchema: {
				role_type: z
					.enum(["full_time", "contract", "consulting", "part_time"])
					.optional()
					.describe("Type of engagement (full_time, contract, consulting, part_time)"),
				tech_stack: z
					.string()
					.optional()
					.describe("Technologies or tools your project uses"),
			},
		},
		async ({ role_type, tech_stack }) => {
			const parts = ["I'm interested in hiring Duyet."];

			if (role_type) {
				parts.push(`Looking for a ${role_type.replace("_", " ")} engagement.`);
			}
			if (tech_stack) {
				parts.push(`Our tech stack includes: ${tech_stack}.`);
			}

			parts.push(
				"\nPlease use the `hire_me` tool to get detailed hiring information, " +
					"and read `duyet://cv/detailed` for his full experience. " +
					"Provide a summary of his fit for this role, relevant experience, " +
					"and next steps for getting in touch.",
			);

			return {
				messages: [
					{
						role: "user",
						content: {
							type: "text",
							text: parts.join(" "),
						},
					},
				],
			};
		},
	);
}
