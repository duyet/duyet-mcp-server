import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Web Fetch Tool
 *
 * Fetches content from URLs with proper validation and security checks.
 * Supports HTML, JSON, and text content types.
 */

interface FetchResult {
	url: string;
	status: number;
	contentType: string;
	content: string;
	headers?: Record<string, string>;
}

/**
 * Maximum content length to prevent memory issues (10MB)
 */
const MAX_CONTENT_LENGTH = 10 * 1024 * 1024; // 10MB

/**
 * Allowed domains for security (non-GitHub domains)
 */
const ALLOWED_DOMAINS = ["duyet.net", "blog.duyet.net"];

/**
 * Allowed GitHub patterns for security
 * Only allows Duyet's repositories and content
 */
const ALLOWED_GITHUB_PATTERNS = [
	/^https?:\/\/github\.com\/duyet\//i,
	/^https?:\/\/raw\.githubusercontent\.com\/duyet\//i,
	/^https?:\/\/gist\.githubusercontent\.com\/duyet\//i,
	/^https?:\/\/gist\.github\.com\/duyet\//i,
];

/**
 * Validate URL for security
 */
function isUrlAllowed(url: string, allowAnyDomain = false): boolean {
	try {
		const urlObj = new URL(url);

		// Only allow http and https protocols
		if (!["http:", "https:"].includes(urlObj.protocol)) {
			return false;
		}

		// If allowAnyDomain is true, skip domain check
		if (allowAnyDomain) {
			return true;
		}

		const hostname = urlObj.hostname.toLowerCase();
		const fullUrl = url.toLowerCase();

		// Check GitHub patterns (path-based validation)
		if (hostname.includes("github")) {
			return ALLOWED_GITHUB_PATTERNS.some((pattern) => pattern.test(fullUrl));
		}

		// Check if domain is in allowed list
		return ALLOWED_DOMAINS.some(
			(domain) => hostname === domain || hostname.endsWith(`.${domain}`),
		);
	} catch {
		return false;
	}
}

/**
 * Extract text content from HTML
 */
function extractTextFromHtml(html: string): string {
	// Remove script and style tags
	let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
	text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

	// Remove HTML tags but keep content
	text = text.replace(/<[^>]+>/g, " ");

	// Decode common HTML entities
	text = text
		.replace(/&nbsp;/g, " ")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");

	// Clean up whitespace
	text = text.replace(/\s+/g, " ").trim();

	return text;
}

/**
 * Fetch and process URL content
 */
async function fetchUrl(
	url: string,
	allowAnyDomain = false,
	includeHeaders = false,
): Promise<FetchResult> {
	// Validate URL
	if (!isUrlAllowed(url, allowAnyDomain)) {
		throw new Error(
			allowAnyDomain
				? "Invalid URL protocol (only http/https allowed)"
				: `URL not allowed. Allowed domains: ${ALLOWED_DOMAINS.join(", ")}, and Duyet's GitHub repositories (github.com/duyet/*, raw.githubusercontent.com/duyet/*, gist.github.com/duyet/*)`,
		);
	}

	try {
		const response = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; DuyetMCP/0.1; +https://duyet.net/)",
			},
			redirect: "follow",
		});

		const contentType = response.headers.get("content-type") || "text/plain";
		const status = response.status;

		// Check content length to prevent memory issues
		const contentLength = response.headers.get("content-length");
		if (contentLength) {
			const size = Number.parseInt(contentLength, 10);
			if (size > MAX_CONTENT_LENGTH) {
				throw new Error(
					`Content too large: ${(size / 1024 / 1024).toFixed(2)}MB (max ${MAX_CONTENT_LENGTH / 1024 / 1024}MB)`,
				);
			}
		}

		// Get response headers if requested
		const headers: Record<string, string> = {};
		if (includeHeaders) {
			response.headers.forEach((value, key) => {
				headers[key] = value;
			});
		}

		let content: string;

		// Process based on content type
		if (contentType.includes("application/json")) {
			const json = await response.json();
			content = JSON.stringify(json, null, 2);
		} else if (contentType.includes("text/html")) {
			const html = await response.text();
			// For HTML, extract readable text content
			content = extractTextFromHtml(html);

			// Limit content length for large pages
			if (content.length > 10000) {
				content = `${content.substring(0, 10000)}\n\n[Content truncated...]`;
			}
		} else {
			// Plain text or other types
			content = await response.text();

			// Limit content length
			if (content.length > 50000) {
				content = `${content.substring(0, 50000)}\n\n[Content truncated...]`;
			}
		}

		return {
			url,
			status,
			contentType,
			content,
			headers: includeHeaders ? headers : undefined,
		};
	} catch (error) {
		throw new Error(
			`Failed to fetch URL: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Format fetch result as text
 */
function formatFetchResult(result: FetchResult): string {
	let output = `URL: ${result.url}\n`;
	output += `Status: ${result.status}\n`;
	output += `Content-Type: ${result.contentType}\n`;

	if (result.headers) {
		output += "\nHeaders:\n";
		Object.entries(result.headers).forEach(([key, value]) => {
			output += `  ${key}: ${value}\n`;
		});
	}

	output += `\nContent:\n${result.content}\n`;

	return output;
}

/**
 * Register web fetch tool
 */
export function registerWebFetchTool(server: McpServer) {
	server.registerTool(
		"web-fetch",
		{
			title: "Web Fetch",
			description:
				"Fetch content from a URL. Supports HTML (extracts text), JSON, and plain text. By default, only allows trusted domains for security. Set allow_any_domain=true to fetch from any URL (use with caution).",
			inputSchema: {
				url: z.string().url().describe("The URL to fetch content from"),
				allow_any_domain: z
					.boolean()
					.optional()
					.describe(
						"Allow fetching from any domain (default: false, only trusted domains)",
					),
				include_headers: z
					.boolean()
					.optional()
					.describe("Include response headers in the output (default: false)"),
			},
		},
		async ({ url, allow_any_domain = false, include_headers = false }) => {
			try {
				const result = await fetchUrl(url, allow_any_domain, include_headers);
				const formattedResult = formatFetchResult(result);

				return {
					content: [
						{
							type: "text" as const,
							text: formattedResult,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error fetching URL: ${error instanceof Error ? error.message : "Unknown error"}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}

/**
 * Export utility functions for use in other modules
 */
export { isUrlAllowed, extractTextFromHtml, fetchUrl };
