import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, eq, gte, lte } from "drizzle-orm";

import { getDb } from "../database/index";
import { contacts } from "../database/schema";

/**
 * Register the contacts resource with filtering parameters
 */
export function registerContactsResource(server: McpServer, env: Env) {
	server.registerResource(
		"contacts",
		new ResourceTemplate("duyet://contacts/{purpose}/{date_from}/{date_to}/{limit}", {
			list: undefined,
			complete: {
				purpose: (value: string) => {
					return [
						"collaboration",
						"job_opportunity",
						"consulting",
						"general_inquiry",
					].filter((p) => p.startsWith(value));
				},
				limit: (value: string) => {
					const numbers = Array.from({ length: 100 }, (_, i) => String(i + 1));
					return numbers.filter((n) => n.startsWith(value));
				},
			},
		}),
		{
			title: "Contact Submissions",
			description:
				"Contact submissions with filtering options by purpose, date range, and pagination",
			mimeType: "text/plain",
		},
		async (
			uri: URL,
			{
				purpose,
				date_from,
				date_to,
				limit = "20",
			}: { purpose?: string; date_from?: string; date_to?: string; limit?: string },
		) => {
			try {
				const db = getDb(env.DB);
				const limitNum = Math.min(Math.max(Number.parseInt(limit) || 20, 1), 100);

				// Build filters object
				const filters = [];
				if (purpose && purpose !== "undefined") {
					filters.push(eq(contacts.purpose, purpose as any));
				}

				// Add date filters
				if (date_from && date_from !== "undefined") {
					const fromDate = new Date(date_from);
					if (!Number.isNaN(fromDate.getTime())) {
						filters.push(gte(contacts.createdAt, fromDate));
					}
				}
				if (date_to && date_to !== "undefined") {
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
					.where(filters.length > 0 ? and(...filters) : undefined)
					.limit(limitNum);

				if (results.length === 0) {
					const filterText = Object.entries({
						purpose: purpose !== "undefined" ? purpose : undefined,
						date_from: date_from !== "undefined" ? date_from : undefined,
						date_to: date_to !== "undefined" ? date_to : undefined,
					})
						.filter(([_, value]) => value !== undefined && value !== null)
						.map(([key, value]) => `${key}: ${value}`)
						.join(", ");

					const content = `No Contacts Found
								
${filterText ? `Filters Applied: ${filterText}` : "No filters applied"}

Try adjusting your search criteria or check for different date ranges.`;

					return {
						contents: [
							{
								uri: uri.href,
								text: content,
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

						return `${index + 1}. ${contact.purpose.replace("_", " ")}
ID: ${contact.referenceId}
Message: ${contact.message.length > 100 ? `${contact.message.substring(0, 100)}...` : contact.message}
${contact.contactEmail ? `Email: ${contact.contactEmail}` : ""}
Date: ${timestamp}`;
					})
					.join("\n\n");

				const filterSummary = Object.entries({
					purpose: purpose !== "undefined" ? purpose : undefined,
					date_from: date_from !== "undefined" ? date_from : undefined,
					date_to: date_to !== "undefined" ? date_to : undefined,
				})
					.filter(([_, value]) => value !== undefined && value !== null)
					.map(([key, value]) => `${key}: ${value}`)
					.join(", ");

				const totalShown = results.length;

				const content = `Contact Submissions

${filterSummary ? `Filters: ${filterSummary}\n` : ""}Showing: 1-${totalShown} contacts

${contactList}

Total shown: ${totalShown} contacts`;

				return {
					contents: [
						{
							uri: uri.href,
							text: content,
						},
					],
				};
			} catch (error: any) {
				const errorContent = `Error fetching contacts: ${error.message}`;

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
