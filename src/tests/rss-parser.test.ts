// Jest globals are available without import in Jest environment
import { parseDocument } from "htmlparser2";
import { getElementsByTagName } from "domutils";
import {
	extractFieldFromElement,
	extractBlogPostFromItem,
	parseRSSContent,
	formatBlogPostsForMCP,
	type BlogPost,
} from "../tools/get-latest-blog-post";

describe("RSS Parser Utilities", () => {
	const mockRSSXML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
	<channel>
		<title>Test Blog</title>
		<item>
			<title><![CDATA[Test Blog Post]]></title>
			<description><![CDATA[This is a test blog post description]]></description>
			<link>https://example.com/test-post</link>
			<pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
		</item>
		<item>
			<title><![CDATA[Second Post]]></title>
			<description><![CDATA[Another test post]]></description>
			<link>https://example.com/second-post</link>
			<pubDate>Tue, 02 Jan 2024 00:00:00 GMT</pubDate>
		</item>
	</channel>
</rss>`;

	const mockRSSWithCommentCDATA = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
	<channel>
		<item>
			<title><!--[CDATA[Comment CDATA Title]]--></title>
			<description><!--[CDATA[Comment CDATA Description]]--></description>
			<link></link>
			<pubdate>Wed, 03 Jan 2024 00:00:00 GMT</pubdate>
		</item>
	</channel>
</rss>`;

	describe("extractFieldFromElement", () => {
		it("should extract CDATA content from title", () => {
			const doc = parseDocument(mockRSSXML);
			const items = getElementsByTagName("item", doc);
			const title = extractFieldFromElement(items[0], "title");

			expect(title).toBe("Test Blog Post");
		});

		it("should extract link content", () => {
			const doc = parseDocument(mockRSSXML);
			const items = getElementsByTagName("item", doc);
			const link = extractFieldFromElement(items[0], "link");

			expect(link).toBe("https://example.com/test-post");
		});

		it("should extract description CDATA content", () => {
			const doc = parseDocument(mockRSSXML);
			const items = getElementsByTagName("item", doc);
			const description = extractFieldFromElement(items[0], "description");

			expect(description).toBe("This is a test blog post description");
		});

		it("should extract pubDate content", () => {
			const doc = parseDocument(mockRSSXML);
			const items = getElementsByTagName("item", doc);
			// Note: htmlparser2 converts pubDate to lowercase pubdate
			const pubDate = extractFieldFromElement(items[0], "pubdate");

			expect(pubDate).toBe("Mon, 01 Jan 2024 00:00:00 GMT");
		});

		it("should return null for non-existent fields", () => {
			const doc = parseDocument(mockRSSXML);
			const items = getElementsByTagName("item", doc);
			const nonExistent = extractFieldFromElement(items[0], "nonexistent");

			expect(nonExistent).toBeNull();
		});

		it("should handle case-insensitive pubDate field", () => {
			const doc = parseDocument(mockRSSWithCommentCDATA);
			const items = getElementsByTagName("item", doc);
			const pubDate = extractFieldFromElement(items[0], "pubdate");

			expect(pubDate).toBe("Wed, 03 Jan 2024 00:00:00 GMT");
		});
	});

	describe("extractBlogPostFromItem", () => {
		it("should extract complete blog post data", () => {
			const doc = parseDocument(mockRSSXML);
			const items = getElementsByTagName("item", doc);
			const blogPost = extractBlogPostFromItem(items[0]);

			expect(blogPost).toEqual({
				title: "Test Blog Post",
				link: "https://example.com/test-post",
				description: "This is a test blog post description",
				pubDate: "Mon, 01 Jan 2024 00:00:00 GMT",
			});
		});

		it("should handle missing optional fields", () => {
			const incompleteXML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
	<channel>
		<item>
			<title><![CDATA[Only Title]]></title>
		</item>
	</channel>
</rss>`;

			const doc = parseDocument(incompleteXML);
			const items = getElementsByTagName("item", doc);
			const blogPost = extractBlogPostFromItem(items[0]);

			expect(blogPost.title).toBe("Only Title");
			expect(blogPost.link).toBeNull();
			expect(blogPost.description).toBeNull();
			expect(blogPost.pubDate).toBeNull();
		});
	});

	describe("parseRSSContent", () => {
		it("should parse RSS and return correct number of posts", () => {
			const result = parseRSSContent(mockRSSXML, 2);

			expect(result.posts).toHaveLength(2);
			expect(result.totalFound).toBe(2);
		});

		it("should limit posts to requested amount", () => {
			const result = parseRSSContent(mockRSSXML, 1);

			expect(result.posts).toHaveLength(1);
			expect(result.totalFound).toBe(2);
		});

		it("should handle empty RSS feeds", () => {
			const emptyRSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
	<channel>
		<title>Empty Feed</title>
	</channel>
</rss>`;

			const result = parseRSSContent(emptyRSS, 5);

			expect(result.posts).toHaveLength(0);
			expect(result.totalFound).toBe(0);
		});

		it("should filter out null values from posts", () => {
			const result = parseRSSContent(mockRSSXML, 1);
			const post = result.posts[0];

			// Ensure no undefined or null values in the cleaned post
			Object.values(post).forEach((value) => {
				expect(value).not.toBeNull();
				expect(value).not.toBeUndefined();
			});
		});
	});

	describe("formatBlogPostsForMCP", () => {
		it("should format single post correctly", () => {
			const posts: BlogPost[] = [
				{
					title: "Test Post",
					link: "https://example.com/test",
					description: "Test description",
					pubDate: "Mon, 01 Jan 2024 00:00:00 GMT",
				},
			];

			const formatted = formatBlogPostsForMCP(posts);

			expect(formatted).toContain("Latest 1 blog post:");
			expect(formatted).toContain("1. Blog Post:");
			expect(formatted).toContain('"title": "Test Post"');
			expect(formatted).toContain("```json");
		});

		it("should format multiple posts correctly", () => {
			const posts: BlogPost[] = [
				{
					title: "First Post",
					link: "https://example.com/first",
					description: "First description",
					pubDate: "Mon, 01 Jan 2024 00:00:00 GMT",
				},
				{
					title: "Second Post",
					link: "https://example.com/second",
					description: "Second description",
					pubDate: "Tue, 02 Jan 2024 00:00:00 GMT",
				},
			];

			const formatted = formatBlogPostsForMCP(posts);

			expect(formatted).toContain("Latest 2 blog posts:");
			expect(formatted).toContain("1. Blog Post:");
			expect(formatted).toContain("2. Blog Post:");
		});

		it("should handle empty posts array", () => {
			const formatted = formatBlogPostsForMCP([]);

			expect(formatted).toContain("Latest 0 blog post:");
		});
	});
});
