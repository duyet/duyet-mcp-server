/**
 * Centralized MCP response utilities for consistent tool responses
 */

export interface McpTextContent {
	type: "text";
	text: string;
}

export interface McpToolResponse {
	content: McpTextContent[];
	isError?: boolean;
}

/**
 * Create a successful MCP tool response
 */
export function mcpSuccess(text: string): McpToolResponse {
	return {
		content: [{ type: "text", text }],
	};
}

/**
 * Create an error MCP tool response
 */
export function mcpError(message: string): McpToolResponse {
	return {
		content: [{ type: "text", text: message }],
		isError: true,
	};
}

/**
 * Create a rate limit exceeded response
 */
export function mcpRateLimitError(
	reason: string,
	retryAfter?: number,
	alternativeContact = "me@duyet.net",
): McpToolResponse {
	const retryMessage = retryAfter
		? `\n\nYou can try again in ${Math.ceil(retryAfter / 60)} minutes.`
		: "";

	return mcpError(
		`Rate Limit Exceeded\n\n${reason}${retryMessage}\n\nAlternative: Email me directly at ${alternativeContact}`,
	);
}

/**
 * Create a database error response (sanitized)
 */
export function mcpDatabaseError(
	fallbackMessage = "Your request could not be processed. Please try again or contact me@duyet.net.",
): McpToolResponse {
	return {
		content: [{ type: "text", text: fallbackMessage }],
	};
}
