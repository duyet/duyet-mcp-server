import { parseDocument } from "htmlparser2";
import { getElementsByTagName, textContent } from "domutils";
import type { Element } from "domhandler";
import type { BlogPostData, BlogPostsData } from "./types.js";
import { cacheOrFetch, CACHE_CONFIGS } from "../utils/cache.js";

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
 * Fetch and parse RSS feed from URL
 */
export async function fetchAndParseRSS(
	url: string,
	limit = 1,
): Promise<{ posts: BlogPostData[]; totalFound: number }> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
	}

	const xml = await response.text();
	return parseRSSContent(xml, limit);
}

/**
 * Fetch blog posts data (internal, not cached)
 */
async function fetchBlogPostsData(limit: number): Promise<BlogPostsData> {
	const feedUrl = "https://blog.duyet.net/rss.xml";

	try {
		const result = await fetchAndParseRSS(feedUrl, limit);

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
 * Get blog posts data with caching (30 minutes TTL)
 * This is the public API that should be used by tools/resources
 */
export async function getBlogPostsData(limit = 5): Promise<BlogPostsData> {
	const limitNum = Math.min(Math.max(limit, 1), 20);
	const cacheKey = `blog-posts-${limitNum}`;

	return cacheOrFetch(
		cacheKey,
		CACHE_CONFIGS.BLOG,
		() => fetchBlogPostsData(limitNum),
	);
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

/**
 * Extract article content from blog post HTML
 */
export function extractArticleContent(html: string): {
	title: string | null;
	content: string;
	metadata: {
		author?: string;
		publishDate?: string;
		tags?: string[];
	};
} {
	const doc = parseDocument(html);

	// Extract title
	const titleElements = getElementsByTagName("h1", doc);
	const title = titleElements.length > 0 ? textContent(titleElements[0]).trim() : null;

	// Try to find article content in common blog structures
	let contentElements: Element[] = [];

	// Try main article tag first
	contentElements = getElementsByTagName("article", doc);

	// If no article tag, try common content classes
	if (contentElements.length === 0) {
		const allElements = getElementsByTagName("div", doc);
		for (const el of allElements) {
			const className = el.attribs?.class || "";
			if (
				className.includes("content") ||
				className.includes("post") ||
				className.includes("article") ||
				className.includes("entry")
			) {
				contentElements.push(el);
				break;
			}
		}
	}

	// Extract text content
	let content = "";
	if (contentElements.length > 0) {
		// Get all paragraph tags from the content
		const paragraphs = getElementsByTagName("p", contentElements[0]);
		content = paragraphs.map((p) => textContent(p).trim()).join("\n\n");

		// If no paragraphs, get all text
		if (!content) {
			content = textContent(contentElements[0]);
		}
	}

	// Clean up content
	content = content
		.replace(/\s+/g, " ") // Normalize whitespace
		.replace(/\n\s*\n/g, "\n\n") // Normalize line breaks
		.trim();

	// Extract metadata
	const metadata: { author?: string; publishDate?: string; tags?: string[] } = {};

	// Try to find author
	const authorElements = getElementsByTagName("meta", doc);
	for (const meta of authorElements) {
		if (meta.attribs?.name === "author" || meta.attribs?.property === "article:author") {
			metadata.author = meta.attribs.content;
			break;
		}
	}

	// Try to find publish date
	for (const meta of authorElements) {
		if (meta.attribs?.property === "article:published_time") {
			metadata.publishDate = meta.attribs.content;
			break;
		}
	}

	// Try to find tags
	const tags: string[] = [];
	for (const meta of authorElements) {
		if (meta.attribs?.property === "article:tag") {
			tags.push(meta.attribs.content);
		}
	}
	if (tags.length > 0) {
		metadata.tags = tags;
	}

	return { title, content, metadata };
}

/**
 * Fetch blog post content (internal, not cached)
 */
async function fetchBlogPostContentInternal(url: string): Promise<{
	url: string;
	title: string | null;
	content: string;
	metadata: {
		author?: string;
		publishDate?: string;
		tags?: string[];
	};
	contentLength: number;
}> {
	// Validate URL
	const blogUrl = new URL(url);
	if (blogUrl.hostname !== "blog.duyet.net" && blogUrl.hostname !== "duyet.net") {
		throw new Error("Only blog.duyet.net and duyet.net URLs are supported");
	}

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}

	const html = await response.text();
	const { title, content, metadata } = extractArticleContent(html);

	return {
		url,
		title,
		content,
		metadata,
		contentLength: content.length,
	};
}

/**
 * Fetch and extract blog post content from URL with caching (30 minutes TTL)
 * This is the public API that should be used by tools/resources
 */
export async function fetchBlogPostContent(url: string): Promise<{
	url: string;
	title: string | null;
	content: string;
	metadata: {
		author?: string;
		publishDate?: string;
		tags?: string[];
	};
	contentLength: number;
}> {
	// Use URL as cache key (normalized)
	const cacheKey = `blog-post-${encodeURIComponent(url)}`;

	return cacheOrFetch(
		cacheKey,
		CACHE_CONFIGS.BLOG,
		() => fetchBlogPostContentInternal(url),
	);
}
