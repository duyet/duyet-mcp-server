import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { count, sql, gte } from "drizzle-orm";

import { getDb } from "../database/index";
import { contacts } from "../database/schema";

/**
 * Register the contact-analytics MCP tool for insights and statistics
 * Analytics data is written to Cloudflare Analytics Engine and computed from D1 contacts
 */
export function registerContactAnalyticsTool(server: McpServer, env: Env) {
	const db = getDb(env.DB);

	server.tool(
		"contact_analytics",
		{
			report_type: z
				.enum([
					"summary",
					"purpose_breakdown",
					"daily_trends",
					"recent_activity",
					"custom_period",
				])
				.default("summary")
				.describe("Type of analytics report to generate"),
			date_from: z
				.string()
				.optional()
				.describe("Start date for custom period (YYYY-MM-DD format)"),
			date_to: z
				.string()
				.optional()
				.describe("End date for custom period (YYYY-MM-DD format)"),
		},
		async ({ report_type = "summary", date_from, date_to }) => {
			try {
				switch (report_type) {
					case "summary": {
						const purposeBreakdown = await db
							.select({
								purpose: contacts.purpose,
								count: count(contacts.id),
							})
							.from(contacts)
							.groupBy(contacts.purpose);

						const total = purposeBreakdown.reduce((sum, item) => sum + item.count, 0);
						const thirtyDaysAgo = Math.floor(
							(Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000,
						);

						const recentCount = await db
							.select({ count: count(contacts.id) })
							.from(contacts)
							.where(gte(contacts.createdAt, new Date(thirtyDaysAgo * 1000)));

						const breakdown = purposeBreakdown
							.map((item) => `${item.purpose.replace("_", " ")}: ${item.count}`)
							.join(", ");

						return {
							content: [
								{
									type: "text",
									text: `Contact Analytics Summary

Total Contacts: ${total}
Recent (30 days): ${recentCount[0]?.count || 0}

Purpose Breakdown: ${breakdown}

Status: ${total > 0 ? "Active contact system" : "No contacts yet"}`,
								},
							],
						};
					}

					case "purpose_breakdown": {
						const result = await db
							.select({
								purpose: contacts.purpose,
								count: count(contacts.id),
							})
							.from(contacts)
							.groupBy(contacts.purpose);

						const total = result.reduce((sum, item) => sum + item.count, 0);

						const breakdown = result
							.map((item) => {
								const percentage =
									total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;

								return `${item.purpose.replace("_", " ")}
Count: ${item.count}
Percentage: ${percentage}%`;
							})
							.join("\n\n");

						return {
							content: [
								{
									type: "text",
									text: `Contact Purpose Breakdown

Total Contacts: ${total}

${breakdown}`,
								},
							],
						};
					}

					case "daily_trends": {
						const result = await db
							.select({
								date: sql<string>`strftime('%Y-%m-%d', datetime(${contacts.createdAt}, 'unixepoch'))`,
								daily_total: count(contacts.id),
							})
							.from(contacts)
							.groupBy(
								sql`strftime('%Y-%m-%d', datetime(${contacts.createdAt}, 'unixepoch'))`,
							)
							.orderBy(
								sql`strftime('%Y-%m-%d', datetime(${contacts.createdAt}, 'unixepoch')) DESC`,
							)
							.limit(30);

						const chart = result
							.map((item) => {
								const date = new Date(item.date!).toLocaleDateString();
								return `${date}: ${item.daily_total} contacts`;
							})
							.join("\n");

						const totalRecent = result.reduce((sum, item) => sum + item.daily_total, 0);
						const avgDaily = (totalRecent / result.length).toFixed(1);
						const maxValue = Math.max(...result.map((item) => item.daily_total));

						return {
							content: [
								{
									type: "text",
									text: `Daily Contact Trends (Last 30 Days)

${chart}

Statistics
- Total (30 days): ${totalRecent}
- Daily Average: ${avgDaily}
- Peak Day: ${maxValue} contacts
- Most Recent: ${result[0]?.daily_total || 0} contacts`,
								},
							],
						};
					}

					case "recent_activity": {
						const sevenDaysAgo = Math.floor(
							(Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000,
						);
						const result = await db
							.select({
								purpose: contacts.purpose,
								total: count(contacts.id),
								last_submission: sql<string>`max(${contacts.createdAt})`,
							})
							.from(contacts)
							.where(gte(contacts.createdAt, new Date(sevenDaysAgo * 1000)))
							.groupBy(contacts.purpose);

						const total = result.reduce((sum, item) => sum + item.total, 0);

						const activity = result
							.map((item) => {
								const lastDate = new Date(
									item.last_submission!,
								).toLocaleDateString();

								return `${item.purpose.replace("_", " ")}
- Submissions: ${item.total}
- Last activity: ${lastDate}`;
							})
							.join("\n\n");

						return {
							content: [
								{
									type: "text",
									text: `Recent Activity (Last 7 Days)

Total Submissions: ${total}

${activity || "No recent activity"}

Status: ${total > 0 ? "Active" : "Quiet period"}`,
								},
							],
						};
					}

					case "custom_period": {
						if (!date_from || !date_to) {
							return {
								content: [
									{
										type: "text",
										text: `Missing Date Range
										
For custom period analytics, please provide both date_from and date_to parameters in YYYY-MM-DD format.

Example: date_from: "2024-01-01", date_to: "2024-01-31"`,
									},
								],
							};
						}

						const startDate = new Date(date_from);
						const endDate = new Date(date_to);

						if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
							return {
								content: [
									{
										type: "text",
										text: "Invalid date format. Please use YYYY-MM-DD format.",
									},
								],
							};
						}

						const result = await db
							.select({
								purpose: contacts.purpose,
								count: count(contacts.id),
							})
							.from(contacts)
							.where(
								sql`${contacts.createdAt} >= ${Math.floor(startDate.getTime() / 1000)} AND ${contacts.createdAt} <= ${Math.floor(endDate.getTime() / 1000)}`,
							)
							.groupBy(contacts.purpose);

						const total = result.reduce((sum, item) => sum + item.count, 0);

						const breakdown = result
							.map((item) => `${item.purpose.replace("_", " ")}: ${item.count}`)
							.join("\n");

						return {
							content: [
								{
									type: "text",
									text: `Custom Period Analytics (${date_from} to ${date_to})

Total Contacts: ${total}

Purpose Breakdown:
${breakdown || "No contacts in this period"}`,
								},
							],
						};
					}

					default:
						return {
							content: [
								{
									type: "text",
									text: `Invalid Report Type
									
Supported report types:
- summary
- purpose_breakdown
- daily_trends
- recent_activity
- custom_period`,
								},
							],
						};
				}
			} catch (_error) {
				// Log error securely without exposing details
				return {
					content: [
						{
							type: "text",
							text: `Unexpected Error
							
An error occurred while generating analytics. Please try again later.`,
						},
					],
				};
			}
		},
	);
}
