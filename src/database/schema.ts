import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
