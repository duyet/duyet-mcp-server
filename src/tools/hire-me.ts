import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { getDb } from "../database/index";
import { contacts } from "../database/schema";
import { checkRateLimit } from "../utils/rate-limit";
import { logger } from "../utils/logger";

const HIRE_YEAR = 2017;

// Define schemas for tool parameters
const roleTypeSchema = z.enum(["full_time", "contract", "consulting", "part_time"]).optional();
const techStackSchema = z.string().optional();
const companySizeSchema = z.enum(["startup", "scale_up", "enterprise", "agency"]).optional();
const contactEmailSchema = z.string().email().optional();
const additionalNotesSchema = z.string().max(500).optional();

/**
 * Register the hire_me MCP tool with D1 database integration
 */
export function registerHireMeTool(server: McpServer, env: Env) {
	const db = getDb(env.DB);
	server.registerTool(
		"hire_me",
		{
			title: "Hire Me",
			description:
				"Get information about hiring Duyet for various roles - full-time, contract, consulting, or part-time positions. Includes expertise, experience, and next steps",
			inputSchema: {
				role_type: roleTypeSchema.describe("Type of engagement you're interested in"),
				tech_stack: techStackSchema.describe("Technologies/tools your project uses"),
				company_size: companySizeSchema.describe("Company size/type"),
				contact_email: contactEmailSchema.describe("Optional: Your email for follow-up"),
				additional_notes: additionalNotesSchema.describe(
					"Optional: Additional notes or specific requirements (max 500 characters)",
				),
			},
		},
		async ({ role_type, tech_stack, company_size, contact_email, additional_notes }) => {
			// Check rate limiting if user is submitting data (not just browsing)
			if (contact_email || additional_notes || role_type || tech_stack || company_size) {
				const rateLimitCheck = await checkRateLimit(db, contact_email, "hire_me");
				if (!rateLimitCheck.allowed) {
					return {
						content: [
							{
								type: "text",
								text: `Rate Limit Exceeded

${rateLimitCheck.reason}

${rateLimitCheck.retryAfter ? `You can try again in ${Math.ceil(rateLimitCheck.retryAfter / 60)} minutes.` : ""}

Alternative: Email me directly at me@duyet.net with your hiring inquiry.`,
							},
						],
						isError: true,
					};
				}
			}

			const currentYear = new Date().getFullYear();
			const experience = currentYear - HIRE_YEAR;

			let roleSpecificInfo = "";

			if (role_type) {
				const roleInfo = {
					full_time: {
						title: "Full-time Position",
						details:
							"Open to senior/lead data engineering roles with remote flexibility. Prefer companies with strong engineering culture and growth opportunities.",
					},
					contract: {
						title: "Contract Work",
						details:
							"Available for 3-6 month contracts. Specializing in data platform modernization, ClickHouse implementations, and cloud migrations.",
					},
					consulting: {
						title: "Consulting Services",
						details:
							"Strategic consulting for data architecture, technology selection, and team building. Ideal for scaling data infrastructure.",
					},
					part_time: {
						title: "Part-time Engagement",
						details:
							"Limited availability for part-time roles. Best suited for advisory positions or specialized technical contributions.",
					},
				};

				const info = roleInfo[role_type as keyof typeof roleInfo];
				roleSpecificInfo = `\n${info.title}: ${info.details}\n`;
			}

			let techStackMatch = "";
			if (tech_stack) {
				const preferredTech = [
					"clickhouse",
					"kafka",
					"kubernetes",
					"rust",
					"python",
					"typescript",
					"llms",
					"ai agents",
				];
				const matchingTech = preferredTech.filter((tech) =>
					tech_stack.toLowerCase().includes(tech),
				);

				if (matchingTech.length > 0) {
					techStackMatch = `\nTech match: Your stack includes ${matchingTech.join(", ")} - technologies I have deep experience with.\n`;
				} else {
					techStackMatch = `\nTech stack: ${tech_stack}\nI can evaluate fit based on my experience with similar technologies.\n`;
				}
			}

			let companySizeInfo = "";
			if (company_size) {
				const sizePreferences = {
					startup:
						"Perfect! I enjoy the fast-paced environment and building data foundations from scratch.",
					scale_up:
						"Excellent fit! I have strong experience scaling data systems and building robust infrastructure.",
					enterprise:
						"Open to the right opportunity, especially roles involving modernization and innovation.",
					agency: "Interested in project-based work and bringing data expertise to diverse client challenges.",
				};
				companySizeInfo = `\n${sizePreferences[company_size as keyof typeof sizePreferences]}\n`;
			}

			// Save hire inquiry to database if any optional data is provided
			let referenceId: string | undefined;
			if (contact_email || additional_notes || role_type || tech_stack || company_size) {
				referenceId = crypto.randomUUID();
				const ip_address = "unknown";
				const user_agent = "MCP Client";

				// Create a message from the provided information
				const messageParts = [];
				if (role_type) messageParts.push(`Role Type: ${role_type}`);
				if (tech_stack) messageParts.push(`Tech Stack: ${tech_stack}`);
				if (company_size) messageParts.push(`Company Size: ${company_size}`);
				if (additional_notes) messageParts.push(`Notes: ${additional_notes}`);

				const message =
					messageParts.length > 0
						? `Hire Me Inquiry - ${messageParts.join(", ")}`
						: "Hire Me Inquiry";

				try {
					await db.insert(contacts).values({
						message,
						contactEmail: contact_email,
						purpose: "hire_me",
						roleType: role_type,
						techStack: tech_stack,
						companySize: company_size,
						ipAddress: ip_address,
						userAgent: user_agent,
						referenceId,
					});
				} catch (error) {
					// Log error securely without exposing details
					logger.error("database", "Failed to save hire_me inquiry", {
						error: error instanceof Error ? error.message : String(error),
					});
					referenceId = undefined;
				}
			}

			return {
				content: [
					{
						type: "text",
						text: `Hire Duyet - Senior Data Engineer

Experience: ${experience}+ years in Data Engineering
Specialization: Data Platform Architecture, Real-time Analytics, Cloud Infrastructure
Location: Remote-first, open to global opportunities

${roleSpecificInfo}${techStackMatch}${companySizeInfo}

Core Expertise:
- Data Platforms: ClickHouse, Airflow
- Languages: Rust, Python, TypeScript, SQL
- Infrastructure: Kubernetes, Docker, Terraform
- Databases: ClickHouse, PostgreSQL, Redis, DuckDB, etc.

What I Bring:
- Design and implement scalable data architectures
- Modernize legacy data systems
- Build real-time analytics pipelines  
- Optimize query performance and costs
- Mentor data engineering teams
- Strong DevOps and infrastructure background

Recent Achievements:
- Built data platforms handling billions of events daily
- Reduced query times by 90% through ClickHouse optimization
- Led teams in migrating from legacy to modern data stack
- Open source contributor with 1000+ GitHub stars

Next Steps:
1. Review: Check my CV at https://duyet.net/cv
2. Portfolio: Explore projects at https://github.com/duyet  
3. Contact: Email me@duyet.net with:
   - Role details and requirements
   - Company info and team structure
   - Technical challenges you're facing
   - Timeline and budget expectations

Ideal Opportunities:
- Data Platform Architect
- Data Platform Engineer
- AI Agent Engineer
- Remote-first companies with strong engineering culture

Ready to discuss how I can help solve your data challenges.

${referenceId ? `\n---\nInquiry Reference ID: ${referenceId}\nYour hiring inquiry has been saved for follow-up.` : ""}`,
					},
				],
			};
		},
	);
}
