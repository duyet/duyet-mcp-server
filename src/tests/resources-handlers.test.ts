import { registerAboutDuyetResource } from "../resources/about-duyet";
import { registerBlogPostsResource } from "../resources/blog-posts";
import { registerCVResource } from "../resources/cv";
import { registerGitHubActivityResource } from "../resources/github-activity";
import { registerContactsResource } from "../resources/contacts";
import { registerHireMeResource } from "../resources/hire-me";
import { getDb } from "../database";

jest.mock("../database/index", () => ({
	getDb: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock the McpServer with resource handling
const mockServer = {
	handlers: new Map<string, any>(),
	registerResource: jest.fn(function (this: any, name: string, _template, _config, handler: any) {
		this.handlers.set(name, handler);
	}),
	getResourceHandler(name: string) {
		return this.handlers.get(name);
	},
};

// Register all resources once
registerAboutDuyetResource(mockServer as any);
registerBlogPostsResource(mockServer as any);
registerCVResource(mockServer as any);
registerGitHubActivityResource(mockServer as any);
registerContactsResource(mockServer as any, { DB: "mock" } as any);
registerHireMeResource(mockServer as any);

describe("Resource Handlers Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Setup default fetch mock
		(global.fetch as jest.Mock).mockImplementation((url: string | URL) => {
			const urlString = url.toString();
			if (urlString.endsWith("cv.json")) {
				return Promise.resolve({
					ok: true,
					text: () => Promise.resolve('{ "name": "Duyet Le" }'),
					json: () => Promise.resolve({ name: "Duyet Le" }),
				});
			}
			if (urlString.endsWith("/cv")) {
				return Promise.resolve({
					ok: true,
					text: () =>
						Promise.resolve(
							"<html><head><title>Mocked CV Title</title></head><body>CV content</body></html>",
						),
				});
			}
			// Default mock for blog posts and github
			return Promise.resolve({
				ok: true,
				status: 200,
				text: async () => `<?xml version="1.0"?>
				<rss version="2.0">
					<channel>
						<title>Duyet's Blog</title>
						<item>
							<title>Test Blog Post</title>
							<link>https://blog.duyet.net/test</link>
							<description>Test description</description>
							<pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
						</item>
					</channel>
				</rss>`,
				json: async () => [
					{
						type: "PushEvent",
						created_at: "2024-01-01T00:00:00Z",
						repo: { name: "duyet/test-repo" },
						payload: { commits: [{ message: "Test commit" }] },
					},
				],
			});
		});
	});

	describe("Blog Posts Resource Handler", () => {
		let resourceHandler: any;
		beforeAll(() => {
			const handler = mockServer.getResourceHandler("blog-posts");
			if (!handler) {
				throw new Error("blog-posts handler not registered");
			}
			resourceHandler = handler;
		});

		test("should handle blog posts resource with limit parameter", async () => {
			const mockUri = new URL("duyet://blog/posts/3");
			const result = await resourceHandler(mockUri, { limit: "3" });

			expect(result.contents).toBeDefined();
			expect(result.contents[0].text).toContain("Test Blog Post");
			expect(result.contents[0].uri).toBe(mockUri.href);
		});

		test("should handle blog posts resource with default limit", async () => {
			const mockUri = new URL("duyet://blog/posts/1");
			const result = await resourceHandler(mockUri, {});

			expect(result.contents).toBeDefined();
			expect(result.contents[0].text).toContain("Test Blog Post");
		});

		test("should handle empty blog posts response", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				text: async () => `<?xml version="1.0"?>
					<rss version="2.0">
						<channel>
							<title>Duyet's Blog</title>
						</channel>
					</rss>`,
			});

			const mockUri = new URL("duyet://blog/posts/1");
			const result = await resourceHandler(mockUri, { limit: "1" });

			expect(result.contents[0].text).toBe("No blog posts found");
		});

		test("should handle blog posts fetch error", async () => {
			(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

			const mockUri = new URL("duyet://blog/posts/1");
			const result = await resourceHandler(mockUri, { limit: "1" });

			expect(result.contents[0].text).toContain("Error fetching blog posts");
			expect(result.contents[0].text).toContain("Network error");
		});

		test("should handle invalid limit parameter", async () => {
			const mockUri = new URL("duyet://blog/posts/invalid");
			const result = await resourceHandler(mockUri, { limit: "invalid" });

			expect(result.contents).toBeDefined();
			expect(result.contents[0].text).toContain("Test Blog Post");
		});

		test("should handle limit parameter exceeding maximum", async () => {
			const mockUri = new URL("duyet://blog/posts/50");
			const result = await resourceHandler(mockUri, { limit: "50" });

			expect(result.contents).toBeDefined();
			expect(result.contents[0].text).toContain("Test Blog Post");
		});
	});

	describe("CV Resource Handler", () => {
		let resourceHandler: any;
		beforeAll(() => {
			const handler = mockServer.getResourceHandler("cv");
			if (!handler) {
				throw new Error("cv handler not registered");
			}
			resourceHandler = handler;
		});

		test("should handle CV resource with summary format", async () => {
			const mockUri = new URL("duyet://cv/summary");
			const result = await resourceHandler(mockUri, { format: "summary" });

			expect(result.contents).toBeDefined();
			expect(result.contents[0].text).toContain("Mocked CV Title");
			expect(result.contents[0].text).toContain("CV Link: https://duyet.net/cv");
		});

		test("should handle CV resource with detailed format", async () => {
			const mockUri = new URL("duyet://cv/detailed");
			const result = await resourceHandler(mockUri, { format: "detailed" });

			expect(result.contents[0].text).toContain("Mocked CV Title");
			expect(result.contents[0].text).toContain("Key Highlights:");
		});

		test("should handle CV resource with json format", async () => {
			const mockUri = new URL("duyet://cv/json");
			const result = await resourceHandler(mockUri, { format: "json" });

			expect(result.contents[0].text).toContain(`"name": "Duyet Le"`);
		});

		test("should handle CV resource with no format (defaults to summary)", async () => {
			const mockUri = new URL("duyet://cv/default");
			const result = await resourceHandler(mockUri, {});

			expect(result.contents[0].text).toContain("Mocked CV Title");
			expect(result.contents[0].text).toContain("CV Link: https://duyet.net/cv");
		});

		test("should default to summary for invalid format", async () => {
			const mockUri = new URL("duyet://cv/invalid");
			const result = await resourceHandler(mockUri, { format: "invalid" });

			expect(result.contents[0].text).toContain("Mocked CV Title");
			expect(result.contents[0].text).toContain("CV Link: https://duyet.net/cv");
		});
	});

	describe("GitHub Activity Resource Handler", () => {
		let resourceHandler: any;
		beforeAll(() => {
			const handler = mockServer.getResourceHandler("github-activity");
			if (!handler) {
				throw new Error("github-activity handler not registered");
			}
			resourceHandler = handler;
		});

		test("should handle GitHub activity resource with limit", async () => {
			const mockUri = new URL("duyet://github/activity/5");
			const result = await resourceHandler(mockUri, { limit: "5" });

			expect(result.contents).toBeDefined();
			expect(result.contents[0].text).toContain("Recent GitHub Activity");
		});

		test("should handle GitHub activity fetch error", async () => {
			(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

			const mockUri = new URL("duyet://github/activity/5");
			const result = await resourceHandler(mockUri, { limit: "5" });

			expect(result.contents[0].text).toContain("Error fetching GitHub activity");
		});
	});

	describe("Contacts Resource Handler", () => {
		let resourceHandler: any;
		beforeAll(() => {
			const handler = mockServer.getResourceHandler("contacts");
			if (!handler) {
				throw new Error("contacts handler not registered");
			}
			resourceHandler = handler;
		});

		test("should handle contacts resource", async () => {
			const mockDb = {
				select: jest.fn().mockReturnThis(),
				from: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				limit: jest.fn().mockResolvedValue([
					{
						id: 1,
						referenceId: "ref123",
						purpose: "collaboration",
						message: "Test message",
						contactEmail: "test@example.com",
						createdAt: new Date("2024-01-01T00:00:00.000Z"),
					},
				]),
			};
			(getDb as jest.Mock).mockReturnValue(mockDb);

			const mockUri = new URL("duyet://contacts");
			const result = await resourceHandler(mockUri, {});

			expect(result.contents).toBeDefined();
			expect(result.contents[0].text).toContain("Contact Submissions");
			expect(mockDb.select).toHaveBeenCalled();
		});

		test("should handle contacts resource with database error", async () => {
			(getDb as jest.Mock).mockImplementation(() => {
				throw new Error("DB error");
			});

			const mockUri = new URL("duyet://contacts");
			const result = await resourceHandler(mockUri, {});

			expect(result.contents[0].text).toContain("Error fetching contacts: DB error");
		});

		test("should handle empty contacts response", async () => {
			const mockDb = {
				select: jest.fn().mockReturnThis(),
				from: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				limit: jest.fn().mockResolvedValue([]),
			};
			(getDb as jest.Mock).mockReturnValue(mockDb);

			const mockUri = new URL("duyet://contacts");
			const result = await resourceHandler(mockUri, {});

			expect(result.contents[0].text).toContain("No Contacts Found");
		});
	});

	describe("Hire Me Resource Handler", () => {
		let resourceHandler: any;
		beforeAll(() => {
			const handler = mockServer.getResourceHandler("hire-me");
			if (!handler) {
				throw new Error("hire-me handler not registered");
			}
			resourceHandler = handler;
		});

		test("should handle hire me resource with role type", async () => {
			const mockUri = new URL("duyet://hire-me/full_time");
			const result = await resourceHandler(mockUri, { role_type: "full_time" });

			expect(result.contents).toBeDefined();
			expect(result.contents[0].text).toContain("Full-time Position");
			expect(result.contents[0].text).toContain("Open to senior/lead data engineering roles");
		});

		test("should handle hire me resource with all parameters", async () => {
			const mockUri = new URL("duyet://hire-me/consulting");
			const result = await resourceHandler(mockUri, {
				role_type: "consulting",
				company_size: "enterprise",
				tech_stack: "React, Node.js",
			});

			expect(result.contents[0].text).toContain("Consulting Services");
			expect(result.contents[0].text).toContain(
				"especially roles involving modernization and innovation",
			);
		});

		test("should handle hire me resource with minimal parameters", async () => {
			const mockUri = new URL("duyet://hire-me/contract");
			const result = await resourceHandler(mockUri, { role_type: "contract" });

			expect(result.contents[0].text).toContain("Contract Work");
		});

		test("should handle hire me resource with no role_type", async () => {
			const mockUri = new URL("duyet://hire-me/general");
			const result = await resourceHandler(mockUri, {});

			expect(result.contents[0].text).toContain("Hire Duyet");
			expect(result.contents[0].text).not.toContain("Full-time Position");
		});
	});
});
