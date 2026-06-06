import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Register the "introduce-duyet" prompt.
 * No arguments — instructs the LLM to use the about + cv resources.
 */
export function registerIntroduceDuyetPrompt(server: McpServer) {
	server.registerPrompt(
		"introduce-duyet",
		{
			title: "Introduce Duyet",
			description:
				"Generate a introduction of Duyet Le using his profile and CV. Great for learning who Duyet is, what he does, and how to reach him.",
		},
		async () => {
			return {
				messages: [
					{
						role: "user",
						content: {
							type: "text",
							text: `Please introduce Duyet Le using the following MCP resources:

1. Read the resource \`duyet://about\` for his profile and background.
2. Read the resource \`duyet://cv/summary\` for his professional experience.

Combine these into a friendly, concise introduction covering:
- Who he is and what he does
- Key technical expertise and achievements
- How to connect with him

Keep it conversational and informative.`,
						},
					},
				],
			};
		},
	);
}
