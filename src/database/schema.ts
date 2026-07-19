import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const contacts = sqliteTable("contacts", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	message: text("message").notNull(),
	contactEmail: text("contact_email"),
	purpose: text("purpose", {
		enum: ["collaboration", "job_opportunity", "consulting", "general_inquiry", "hire_me"],
	}).notNull(),
	referenceId: text("reference_id").notNull().unique(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	// Additional fields for hire_me entries
	roleType: text("role_type", {
		enum: ["full_time", "contract", "consulting", "part_time"],
	}),
	techStack: text("tech_stack"),
	companySize: text("company_size", {
		enum: ["startup", "scale_up", "enterprise", "agency"],
	}),
	createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
	updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

/**
 * Long-term MCP usage aggregates (one row per day/client/method/tool/country).
 * Analytics Engine keeps raw events only ~90 days; this table keeps daily
 * rollups forever with a single upsert per request.
 */
export const usageStats = sqliteTable(
	"usage_stats",
	{
		date: text("date").notNull(), // YYYY-MM-DD
		client: text("client").notNull().default(""),
		clientVersion: text("client_version").notNull().default(""),
		method: text("method").notNull().default(""),
		tool: text("tool").notNull().default(""),
		resource: text("resource").notNull().default(""),
		country: text("country").notNull().default(""),
		count: integer("count").notNull().default(0),
	},
	(t) => [
		primaryKey({
			columns: [t.date, t.client, t.clientVersion, t.method, t.tool, t.resource, t.country],
		}),
	],
);
