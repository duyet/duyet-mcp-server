import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "../database/index";
import { contacts } from "../database/schema";

/**
 * Register the get-contacts MCP tool for retrieving contact submissions
 */
export function registerGetContactsTool(server: McpServer, env: Env) {
	const db = getDb(env.DB);

	server.tool(
		"get_contacts",
		{
			purpose: z
				.enum(["collaboration", "job_opportunity", "consulting", "general_inquiry"])
				.optional()
				.describe("Filter by purpose of contact"),
			date_from: z.string().optional().describe("Start date filter (YYYY-MM-DD format)"),
			date_to: z.string().optional().describe("End date filter (YYYY-MM-DD format)"),
			contact_email: z.string().email().optional().describe("Filter by contact email"),
			reference_id: z.string().optional().describe("Get specific contact by reference ID"),
			limit: z
				.number()
				.min(1)
				.max(100)
				.default(20)
				.describe("Maximum number of contacts to return (1-100)"),
			offset: z
				.number()
				.min(0)
				.default(0)
				.describe("Number of contacts to skip for pagination"),
		},
		async ({
			purpose,
			date_from,
			date_to,
			contact_email,
			reference_id,
			limit = 20,
			offset = 0,
		}) => {
			try {
				// If reference_id is provided, get specific contact
				if (reference_id) {
					const [contact] = await db
						.select()
						.from(contacts)
						.where(eq(contacts.referenceId, reference_id));

					if (!contact) {
						return {
							content: [
								{
									type: "text",
									text: `Contact Not Found
									
Reference ID: ${reference_id}

Please check the reference ID and try again.`,
								},
							],
						};
					}

					const timestamp = new Date(contact.createdAt || Date.now()).toLocaleString();

					return {
						content: [
							{
								type: "text",
								text: `Contact Details

Reference ID: ${contact.referenceId}
Message: ${contact.message}
${contact.contactEmail ? `Email: ${contact.contactEmail}` : ""}
Purpose: ${contact.purpose.replace("_", " ")}
Submitted: ${timestamp}
IP: ${contact.ipAddress || "N/A"}
User Agent: ${contact.userAgent || "N/A"}`,
							},
						],
					};
				}

				// Build filters object
				const filters = [];
				if (purpose) filters.push(eq(contacts.purpose, purpose));
				if (contact_email) filters.push(eq(contacts.contactEmail, contact_email));

				// Add date filters
				if (date_from) {
					const fromDate = new Date(date_from);
					if (!Number.isNaN(fromDate.getTime())) {
						filters.push(gte(contacts.createdAt, fromDate));
					}
				}
				if (date_to) {
					const toDate = new Date(date_to);
					if (!Number.isNaN(toDate.getTime())) {
						// Add 24 hours to include the entire day
						toDate.setHours(23, 59, 59, 999);
						filters.push(lte(contacts.createdAt, toDate));
					}
				}

				const results = await db
					.select()
					.from(contacts)
					.where(and(...filters))
					.limit(limit)
					.offset(offset);

				if (results.length === 0) {
					const filterText = Object.entries({
						purpose,
						date_from,
						date_to,
						contact_email,
					})
						.filter(([_, value]) => value !== undefined && value !== null)
						.map(([key, value]) => `${key}: ${value}`)
						.join(", ");

					return {
						content: [
							{
								type: "text",
								text: `No Contacts Found
								
${filterText ? `Filters Applied: ${filterText}` : "No filters applied"}

Try adjusting your search criteria or check for different date ranges.`,
							},
						],
					};
				}

				// Format contacts for display
				const contactList = results
					.map((contact, index) => {
						const timestamp = new Date(
							contact.createdAt || Date.now(),
						).toLocaleString();

						return `${offset + index + 1}. ${contact.purpose.replace("_", " ")}
ID: ${contact.referenceId}
Message: ${contact.message.length > 100 ? `${contact.message.substring(0, 100)}...` : contact.message}
${contact.contactEmail ? `Email: ${contact.contactEmail}` : ""}
Date: ${timestamp}`;
					})
					.join("\n\n");

				const filterSummary = Object.entries({ purpose, date_from, date_to, contact_email })
					.filter(
						([key, value]) =>
							value !== undefined &&
							value !== null &&
							key !== "limit" &&
							key !== "offset",
					)
					.map(([key, value]) => `${key}: ${value}`)
					.join(", ");

				const totalShown = results.length;
				const hasMore = totalShown === limit;
				const nextOffset = offset + limit;

				return {
					content: [
						{
							type: "text",
							text: `Contact Submissions

${filterSummary ? `Filters: ${filterSummary}\n` : ""}Showing: ${offset + 1}-${offset + totalShown} contacts
${hasMore ? `Next page: Use offset ${nextOffset}` : ""}

${contactList}

Total shown: ${totalShown} contacts
${hasMore ? "\nTip: Increase offset parameter to see more results" : ""}`,
						},
					],
				};
			} catch (_error) {
				// Log error securely without exposing details
				return {
					content: [
						{
							type: "text",
							text: `Unexpected Error
							
An error occurred while retrieving contacts. Please try again later.`,
						},
					],
				};
			}
		},
	);
}
