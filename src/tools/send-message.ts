import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { getDb } from "../database/index";
import { contacts } from "../database/schema";

/**
 * Register the send_message MCP tool with D1 database integration
 */
export function registerSendMessageTool(server: McpServer, env: Env) {
	const db = getDb(env.DB);

	server.registerTool(
		"send_message",
		{
			title: "Send Message to Duyet",
			description:
				"Send a message to Duyet for collaboration, job opportunities, consulting, or general inquiries. Messages are saved with a reference ID for follow-up",
			inputSchema: {
				message: z
					.string()
					.min(10)
					.max(500)
					.describe("Message to send to Duyet (10-500 characters)"),
				contact_email: z
					.string()
					.email()
					.optional()
					.describe("Optional: Your email for response"),
				purpose: z
					.enum(["collaboration", "job_opportunity", "consulting", "general_inquiry"])
					.describe("Purpose of your message"),
			},
		},
		async ({ message, contact_email, purpose }) => {
			// Extract metadata - simplified for MCP context
			const ip_address = "unknown";
			const user_agent = "MCP Client";
			const referenceId = crypto.randomUUID();

			try {
				await db.insert(contacts).values({
					message,
					contactEmail: contact_email,
					purpose: purpose,
					ipAddress: ip_address,
					userAgent: user_agent,
					referenceId,
				});
			} catch (_e: any) {
				// Log error securely without exposing details
				return {
					content: [
						{
							type: "text",
							text: "Your message was received but could not be saved to our system. Please try again or send your message directly via email at me@duyet.net.",
						},
					],
				};
			}

			const timestamp = new Date().toLocaleString();

			return {
				content: [
					{
						type: "text",
						text: `Message Sent Successfully

Reference ID: ${referenceId}
Message: ${message}
${contact_email ? `Your Email: ${contact_email}` : ""}
Purpose: ${purpose.replace("_", " ")}
Submitted: ${timestamp}

How to reach Duyet:

Email: me@duyet.net
LinkedIn: https://linkedin.com/in/duyet
GitHub: https://github.com/duyet

Your message has been recorded for follow-up.

${purpose === "job_opportunity" ? "\nFor Job Opportunities: Please include details about the role, company, and tech stack. Remote positions preferred." : ""}
${purpose === "consulting" ? "\nFor Consulting: Please provide project scope, timeline, and technical requirements." : ""}`,
					},
				],
			};
		},
	);
}
