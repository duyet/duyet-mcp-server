import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { answerHRQuestion } from "../core/career.js";

/**
 * Register HR quick Q&A tool
 * Answers common recruiter questions about salary, remote work, availability, etc.
 */
export function registerHRQuickQATool(server: McpServer) {
	server.registerTool(
		"hr-quick-qa",
		{
			title: "HR Quick Q&A",
			description:
				"Quick answers to common HR/recruiter questions (salary expectations, remote work, availability, visa, skills). Fast responses for initial screening.",
			inputSchema: {
				question: z
					.string()
					.min(3)
					.describe(
						"Question from HR/recruiter (e.g., 'What are your salary expectations?', 'Are you open to remote work?', 'When are you available?')",
					),
			},
		},
		async ({ question }) => {
			try {
				const answer = answerHRQuestion(question);

				return {
					content: [
						{
							type: "text",
							text: `**Question**: ${question}

**Answer**:
${answer}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Unable to answer the question at this time. For detailed information, please use the 'get_career_preferences' tool or contact directly via 'send-message' tool.`,
						},
					],
				};
			}
		},
	);
}
