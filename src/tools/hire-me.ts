import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register the hire_me MCP tool
 */
export function registerHireMeTool(server: McpServer) {
	server.tool(
		"hire_me",
		{
			role_type: z
				.enum(["full_time", "contract", "consulting", "part_time"])
				.optional()
				.describe("Type of engagement you're interested in"),
			tech_stack: z.string().optional().describe("Technologies/tools your project uses"),
			company_size: z
				.enum(["startup", "scale_up", "enterprise", "agency"])
				.optional()
				.describe("Company size/type"),
		},
		async ({ role_type, tech_stack, company_size }) => {
			const currentYear = new Date().getFullYear();
			const experience = currentYear - 2017;

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

				const info = roleInfo[role_type];
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
				companySizeInfo = `\n${sizePreferences[company_size]}\n`;
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

Ready to discuss how I can help solve your data challenges.`,
					},
				],
			};
		},
	);
}
