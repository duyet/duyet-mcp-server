import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register the say-hi MCP tool for greeting Duyet
 */
export function registerSayHiTool(server: McpServer) {
	server.tool(
		"say_hi",
		{
			message: z
				.string()
				.optional()
				.describe("Optional personal message to include with the greeting"),
		},
		async ({ message }) => {
			const greeting = message 
				? `Hi Duyet! ${message}` 
				: "Hi Duyet! 👋";

			const responses = [
				"Thanks for saying hi! Hope you're having a great day! 😊",
				"Hello there! Great to hear from you! 🌟",
				"Hi! Always nice to get a friendly greeting! ✨",
				"Hey! Thanks for reaching out. Hope all is well! 🚀",
				"Hello! Appreciate you taking the time to say hi! 💫"
			];

			const randomResponse = responses[Math.floor(Math.random() * responses.length)];

			return {
				content: [
					{
						type: "text",
						text: `${greeting}

${randomResponse}

Connect with Duyet:
📧 Email: me@duyet.net
🐙 GitHub: https://github.com/duyet
💼 LinkedIn: https://linkedin.com/in/duyet
📝 Blog: https://blog.duyet.net

Feel free to reach out anytime! 🤝`,
					},
				],
			};
		},
	);
}