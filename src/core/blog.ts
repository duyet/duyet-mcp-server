import { parseDocument } from "htmlparser2";
import { getElementsByTagName, textContent } from "domutils";
import type { Element } from "domhandler";
import type { BlogPostData, BlogPostsData } from "./types.js";
import { cachedFetch } from "./cache.js";

/**
 * Extract field content from RSS item element, handling CDATA and parsing quirks
 */
export function extractFieldFromElement(element: Element, tagName: string): string | null {
	const elements = getElementsByTagName(tagName, element);
	if (elements.length === 0) return null;

	const targetElement = elements[0];
	let content = "";

	// Handle different node types
	if (targetElement.children && targetElement.children.length > 0) {
		for (const child of targetElement.children) {
			if (child.type === "text") {
				content += child.data || "";
			} else if (child.type === "comment") {
				// Handle CDATA parsed as comment
				let data = child.data || "";
				if (data.startsWith("[CDATA[") && data.endsWith("]]")) {
					data = data.slice(7, -2);
				}
				content += data;
			}
		}
	}

	// Fallback to textContent for elements with no children (like link)
	if (!content && tagName === "link") {
		content = textContent(targetElement).trim();
		// If textContent fails, try next sibling for htmlparser2 parsing issues
		if (!content && targetElement.next?.type === "text") {
			content = targetElement.next.data?.trim() || "";
		}
	}

	content = content.trim();

	// Handle CDATA sections - remove CDATA wrapper if present
	if (content.startsWith("<![CDATA[") && content.endsWith("]]>")) {
		content = content.slice(9, -3).trim();
	}

	return content || null;
}

/**
 * Extract blog post data from RSS item element
 */
export function extractBlogPostFromItem(item: Element): BlogPostData {
	return {
		title: extractFieldFromElement(item, "title"),
		link: extractFieldFromElement(item, "link"),
		description: extractFieldFromElement(item, "description"),
		pubDate:
			extractFieldFromElement(item, "pubDate") || extractFieldFromElement(item, "pubdate"),
	};
}

/**
 * Parse RSS XML content and extract blog posts
 */
export function parseRSSContent(
	xml: string,
	limit = 1,
): { posts: BlogPostData[]; totalFound: number } {
	const doc = parseDocument(xml);
	const items = getElementsByTagName("item", doc);

	if (items.length === 0) {
		return { posts: [], totalFound: 0 };
	}

	const postsToFetch = Math.min(limit, items.length);
	const posts: BlogPostData[] = [];

	for (let i = 0; i < postsToFetch; i++) {
		const item = items[i];
		const blogPost = extractBlogPostFromItem(item);

		// Remove null values to clean up the output
		const cleanedPost = Object.fromEntries(
			Object.entries(blogPost).filter(([_, value]) => value !== null && value !== undefined),
		) as BlogPostData;

		posts.push(cleanedPost);
	}

	return {
		posts,
		totalFound: items.length,
	};
}

/**
 * Fetch and parse RSS feed from URL with caching
 */
export async function fetchAndParseRSS(
	url: string,
	limit = 1,
): Promise<{ posts: BlogPostData[]; totalFound: number }> {
	// Cache RSS feed for 10 minutes (600000ms)
	const xml = await cachedFetch(url, async (response) => response.text(), 600000);
	return parseRSSContent(xml, limit);
}

/**
 * Get blog posts data with all metadata
 */
export async function getBlogPostsData(limit = 5): Promise<BlogPostsData> {
	const feedUrl = "https://blog.duyet.net/rss.xml";
	const limitNum = Math.min(Math.max(limit, 1), 20);

	try {
		const result = await fetchAndParseRSS(feedUrl, limitNum);

		return {
			posts: result.posts,
			totalFound: result.totalFound,
			retrieved: result.posts.length,
			feedUrl,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		throw new Error(`Error fetching blog posts: ${errorMessage}`);
	}
}

/**
 * Format blog posts for MCP response
 */
export function formatBlogPostsForMCP(posts: BlogPostData[]): string {
	const postList = posts
		.map((post, index) => {
			const postData = JSON.stringify(post, null, 2);
			return `${index + 1}. Blog Post:\n\`\`\`json\n${postData}\n\`\`\``;
		})
		.join("\n\n");

	return `Latest ${posts.length} blog post${posts.length > 1 ? "s" : ""}:\n\n${postList}`;
}

/**
 * Format blog posts for tool JSON response
 */
export function formatBlogPostsForTool(data: BlogPostsData): string {
	return JSON.stringify(
		{
			posts: data.posts,
			totalFound: data.totalFound,
			retrieved: data.retrieved,
		},
		null,
		2,
	);
}
