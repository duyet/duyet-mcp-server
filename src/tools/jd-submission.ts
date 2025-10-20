import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../database/schema.js";

/**
 * Register JD submission tool for HR/recruiters
 * Allows recruiters to submit job descriptions that can be matched against Duyet's profile
 */
export function registerJDSubmissionTool(server: McpServer, env: Env) {
	server.registerTool(
		"submit-job-description",
		{
			title: "Submit Job Description",
			description:
				"Submit a job description (JD) for Duyet to review. Includes automatic basic matching against career preferences. For HR/recruiters only.",
			inputSchema: {
				company_name: z
					.string()
					.min(2)
					.describe("Company name (e.g., 'Acme Corp', 'TechStartup Inc')"),
				job_title: z
					.string()
					.min(3)
					.describe(
						"Job title (e.g., 'Senior Data Engineer', 'Staff Engineer - Data Platform')",
					),
				job_description: z
					.string()
					.min(50)
					.describe(
						"Full job description including responsibilities, requirements, and benefits",
					),
				salary_range: z
					.string()
					.optional()
					.describe("Salary range if available (e.g., '$100k-$150k USD')"),
				remote_policy: z
					.enum(["remote_only", "hybrid", "onsite"])
					.describe("Work arrangement policy"),
				contact_email: z.string().email().describe("Your email address for follow-up"),
				additional_notes: z.string().optional().describe("Any additional notes or context"),
			},
		},
		async ({
			company_name,
			job_title,
			job_description,
			salary_range,
			remote_policy,
			contact_email,
			additional_notes,
		}) => {
			try {
				// Initialize database
				const db = drizzle(env.DB, { schema });

				// Generate reference ID
				const refId = `JD-${Date.now()}-${Math.random().toString(36).substring(7)}`;

				// Store JD submission in database (reusing contacts table with purpose 'job_description')
				const message = `Job Description Submission

Company: ${company_name}
Position: ${job_title}
Remote Policy: ${remote_policy}
${salary_range ? `Salary Range: ${salary_range}` : ""}

Job Description:
${job_description}

${additional_notes ? `Additional Notes: ${additional_notes}` : ""}`;

				await db.insert(schema.contacts).values({
					purpose: "job_opportunity",
					message,
					contactEmail: contact_email,
					referenceId: refId,
				});

				// Basic matching logic
				const isRemoteCompatible = remote_policy === "remote_only";
				const matchScore = isRemoteCompatible ? "High" : "Low";
				const matchReason = isRemoteCompatible
					? "✅ Matches remote-only requirement"
					: "❌ Does not match remote-only requirement (deal breaker)";

				return {
					content: [
						{
							type: "text",
							text: `# Job Description Submitted Successfully

**Reference ID**: ${refId}

## Submission Details
- **Company**: ${company_name}
- **Position**: ${job_title}
- **Remote Policy**: ${remote_policy}
- **Contact**: ${contact_email}
${salary_range ? `- **Salary Range**: ${salary_range}` : ""}

## Basic Compatibility Check

**Match Score**: ${matchScore}

**Assessment**:
${matchReason}

${!isRemoteCompatible ? "\n⚠️ **Important**: This position does not meet the remote-only requirement, which is a deal breaker. Duyet only considers 100% remote positions." : ""}

${isRemoteCompatible ? "\n✅ This position meets the basic remote work requirement. Duyet will review the full JD and respond if there's mutual interest." : ""}

## Next Steps

1. Your submission has been stored with reference ID: **${refId}**
2. ${isRemoteCompatible ? "Duyet will review the job description" : "Unfortunately, this position doesn't meet the remote-only requirement"}
3. If there's interest, you'll receive a response at: ${contact_email}
4. Expected response time: 3-5 business days

## Additional Resources

For better understanding of requirements, please review:
- Career preferences: Use 'get_career_preferences' tool
- Full CV: Use 'get-cv' tool
- Quick Q&A: Use 'hr-quick-qa' tool for common questions

**Thank you for considering Duyet for this opportunity!**`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error submitting job description. Please try again or contact directly via email.

You can also use the 'send-message' tool with purpose='job_opportunity' as an alternative.`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
