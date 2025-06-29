import { parseDocument } from "htmlparser2";
import { getElementsByTagName } from "domutils";
import {
	extractFieldFromElement,
	extractBlogPostFromItem,
	parseRSSContent,
	formatBlogPostsForMCP,
	registerBlogPostsResource,
} from "../resources/blog-posts";

global.fetch = jest.fn();

const createMockServer = () =>
	({
		registerResource: jest.fn(),
	}) as any;

beforeEach(() => {
	jest.clearAllMocks();
	(global.fetch as jest.Mock).mockClear();
});

describe("Blog Posts Advanced Coverage", () => {
	describe("RSS Processing Edge Cases", () => {
		test("should handle RSS with empty CDATA sections", () => {
			const emptyRSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
	<channel>
		<item>
			<title><![CDATA[]]></title>
			<description><![CDATA[]]></description>
			<link></link>
			<pubDate></pubDate>
		</item>
	</channel>
</rss>`;

			const result = parseRSSContent(emptyRSS, 5);
			expect(result.posts.length).toBeLessThanOrEqual(1);
			expect(result.totalFound).toBe(1);
		});

		test("should handle RSS with malformed XML", () => {
			const malformedRSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
	<channel>
		<item>
			<title>Test Title</title>
			<description>Test Description</description>
			<link>https://test.com</link>
		</item>
		<item>
			<title><!--[CDATA[Comment Title]]--></title>
		</item>
	</channel>
</rss>`;

			const result = parseRSSContent(malformedRSS, 5);
			expect(result.posts.length).toBeGreaterThan(0);
		});

		test("should handle RSS with missing channel", () => {
			const noChannelRSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
</rss>`;

			const result = parseRSSContent(noChannelRSS, 5);
			expect(result.posts).toHaveLength(0);
			expect(result.totalFound).toBe(0);
		});

		test("should handle posts with empty titles", () => {
			const rssWithEmptyTitles = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
	<channel>
		<item>
			<title></title>
			<description>Description without title</description>
		</item>
		<item>
			<title><![CDATA[Valid Title]]></title>
			<description>Valid description</description>
		</item>
	</channel>
</rss>`;

			const result = parseRSSContent(rssWithEmptyTitles, 5);
			expect(result.posts.length).toBeGreaterThan(0);
			const validPost = result.posts.find((p) => p.title === "Valid Title");
			expect(validPost).toBeDefined();
		});
	});

	describe("Blog Posts Resource Registration", () => {
		test("should register blog posts resource", async () => {
			const mockServer = createMockServer();

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				text: async () => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
	<channel>
		<item>
			<title><![CDATA[Test Post]]></title>
			<description><![CDATA[Test Description]]></description>
			<link>https://test.com</link>
			<pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
		</item>
	</channel>
</rss>`,
			});

			let resourceHandler: any;
			(mockServer.registerResource as jest.Mock).mockImplementation(
				(name, _template, _metadata, handler) => {
					if (name === "blog-posts") {
						resourceHandler = handler;
					}
				},
			);

			registerBlogPostsResource(mockServer);
			const result = await resourceHandler(new URL("duyet://blog/posts/1"), { limit: "1" });

			expect(result.contents[0].text).toContain("Test Post");
		});

		test("should handle blog posts resource fetch errors", async () => {
			const mockServer = createMockServer();

			(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

			let resourceHandler: any;
			(mockServer.registerResource as jest.Mock).mockImplementation(
				(name, _template, _metadata, handler) => {
					if (name === "blog-posts") {
						resourceHandler = handler;
					}
				},
			);

			registerBlogPostsResource(mockServer);
			const result = await resourceHandler(new URL("duyet://blog/posts/5"), { limit: "5" });

			expect(result.contents[0].text).toContain("Error");
		});

		test("should register blog posts resource correctly", () => {
			const mockServer = createMockServer();
			registerBlogPostsResource(mockServer);
			expect(mockServer.registerResource).toHaveBeenCalledWith(
				"blog-posts",
				expect.any(Object),
				expect.any(Object),
				expect.any(Function),
			);
		});
	});

	describe("Field Extraction Edge Cases", () => {
		test("should handle elements with no text content", () => {
			const emptyElementXML = `<?xml version="1.0" encoding="UTF-8"?>
<item>
	<title></title>
	<link></link>
</item>`;

			const doc = parseDocument(emptyElementXML);
			const items = getElementsByTagName("item", doc);

			expect(extractFieldFromElement(items[0], "title")).toBeNull();
			expect(extractFieldFromElement(items[0], "link")).toBeNull();
		});

		test("should handle nested elements properly", () => {
			const nestedXML = `<?xml version="1.0" encoding="UTF-8"?>
<item>
	<title>
		<span>Nested Title</span>
	</title>
</item>`;

			const doc = parseDocument(nestedXML);
			const items = getElementsByTagName("item", doc);

			const title = extractFieldFromElement(items[0], "title");
			// The extractFieldFromElement function may include the span tags based on implementation
			expect(title).toContain("Nested Title");
		});
	});

	describe("Blog Post Extraction", () => {
		test("should handle blog post with all null fields", () => {
			const emptyItemXML = `<?xml version="1.0" encoding="UTF-8"?>
<item>
</item>`;

			const doc = parseDocument(emptyItemXML);
			const items = getElementsByTagName("item", doc);

			const blogPost = extractBlogPostFromItem(items[0]);
			expect(blogPost.title).toBeNull();
			expect(blogPost.link).toBeNull();
			expect(blogPost.description).toBeNull();
			expect(blogPost.pubDate).toBeNull();
		});
	});

	describe("Format Edge Cases", () => {
		test("should handle formatting empty blog posts list", () => {
			const formatted = formatBlogPostsForMCP([]);
			expect(formatted).toContain("Latest 0 blog post");
		});

		test("should handle formatting blog posts with null values", () => {
			const postsWithNulls = [
				{
					title: "Test",
					link: null,
					description: null,
					pubDate: null,
				},
			];

			const formatted = formatBlogPostsForMCP(postsWithNulls as any);
			expect(formatted).toContain("Test");
			// The formatBlogPostsForMCP function uses JSON.stringify which will include null values
			expect(formatted).toContain("Blog Post:");
		});
	});
});
