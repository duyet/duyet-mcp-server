import { registerContactsResource } from "../resources/contacts";
import { registerBlogPostsResource } from "../resources/blog-posts";
import { registerCVResource } from "../resources/cv";
import { registerGitHubActivityResource } from "../resources/github-activity";
import { getDb } from "../database";

jest.mock("../database/index", () => ({
	getDb: jest.fn(),
}));
jest.mock("../tools/get-latest-blog-post", () => ({
	...jest.requireActual("../tools/get-latest-blog-post"),
	fetchAndParseRSS: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock the McpServer
const mockServer = {
	handlers: new Map<string, any>(),
	registerResource: jest.fn(function (this: any, name: string, _template, _config, handler: any) {
		this.handlers.set(name, handler);
	}),
	getResourceHandler(name: string) {
		return this.handlers.get(name);
	},
};

registerContactsResource(mockServer as any, { DB: "mock" } as any);
registerBlogPostsResource(mockServer as any);
registerCVResource(mockServer as any);
registerGitHubActivityResource(mockServer as any);

describe("Resource Edge Cases Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(getDb as jest.Mock).mockReturnValue({
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			limit: jest.fn().mockResolvedValue([]),
		});
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			text: async () => "<title>Duyet - Senior Data Engineer</title>",
			json: async () => ({}),
		});
	});

	describe("Contacts Resource Edge Cases", () => {
		let resourceHandler: any;
		beforeAll(() => {
			resourceHandler = mockServer.getResourceHandler("contacts");
		});

		test("should handle contacts with multiple filters", async () => {
			(getDb as jest.Mock).mockReturnValue({
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
			});

			const mockUri = new URL("duyet://contacts/collaboration/2024-01-01/2024-01-31/5");
			const result = await resourceHandler(mockUri, {
				purpose: "collaboration",
				date_from: "2024-01-01",
				date_to: "2024-01-31",
				limit: "5",
			});

			expect(result.contents[0].text).toContain("Contact Submissions");
			expect(result.contents[0].text).toContain("collaboration");
		});

		test("should handle contacts with invalid date parameters", async () => {
			const mockUri = new URL("duyet://contacts/undefined/invalid-date/invalid-date/10");
			const result = await resourceHandler(mockUri, {
				purpose: "undefined",
				date_from: "invalid-date",
				date_to: "invalid-date",
				limit: "10",
			});

			expect(result.contents[0].text).toContain("No Contacts Found");
		});

		test("should handle contacts with long messages", async () => {
			const longMessage =
				"This is a very long message that exceeds 100 characters to test the truncation functionality in the contacts resource handler implementation. It should be truncated with ellipsis.";
			(getDb as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnThis(),
				from: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				limit: jest.fn().mockResolvedValue([
					{
						id: 1,
						referenceId: "ref123",
						purpose: "general_inquiry",
						message: longMessage,
						contactEmail: "test@example.com",
						createdAt: new Date("2024-01-01T00:00:00.000Z"),
					},
				]),
			});

			const mockUri = new URL("duyet://contacts");
			const result = await resourceHandler(mockUri, {});

			expect(result.contents[0].text).toContain("...");
			expect(result.contents[0].text).toContain("general inquiry");
		});

		test("should handle contacts with no email", async () => {
			(getDb as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnThis(),
				from: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				limit: jest.fn().mockResolvedValue([
					{
						id: 1,
						referenceId: "ref123",
						purpose: "collaboration",
						message: "Test message",
						contactEmail: null,
						createdAt: new Date("2024-01-01T00:00:00.000Z"),
					},
				]),
			});

			const mockUri = new URL("duyet://contacts");
			const result = await resourceHandler(mockUri, {});

			expect(result.contents[0].text).toContain("Test message");
			expect(result.contents[0].text).not.toContain("Email:");
		});

		test("should handle contacts with null createdAt", async () => {
			(getDb as jest.Mock).mockReturnValue({
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
						createdAt: null,
					},
				]),
			});

			const mockUri = new URL("duyet://contacts");
			const result = await resourceHandler(mockUri, {});

			expect(result.contents[0].text).toContain("Test message");
		});
	});

	describe("Blog Posts Resource Edge Cases", () => {
		let resourceHandler: any;
		const { fetchAndParseRSS } = jest.requireMock("../tools/get-latest-blog-post");

		beforeAll(() => {
			resourceHandler = mockServer.getResourceHandler("blog-posts");
		});

		test("should handle failed RSS fetch", async () => {
			(fetchAndParseRSS as jest.Mock).mockRejectedValue(new Error("Network error"));

			const mockUri = new URL("duyet://blog/posts/1");
			const result = await resourceHandler(mockUri, { limit: "1" });

			expect(result.contents[0].text).toContain("Error fetching blog posts: Network error");
		});

		test("should handle blog posts with limit bounds", async () => {
			const allPosts = Array.from({ length: 15 }, (_, i) => ({
				title: `Post ${i + 1}`,
			}));
			(fetchAndParseRSS as jest.Mock).mockImplementation(
				async (_url: string, limit: number) => {
					return {
						posts: allPosts.slice(0, limit),
						totalFound: allPosts.length,
					};
				},
			);

			const mockUri = new URL("duyet://blog/posts/20"); // limit > 10
			const result = await resourceHandler(mockUri, { limit: "20" });

			expect(result.contents[0].text).toContain("Latest 10 blog posts");
			expect(result.contents[0].text).toContain("Post 10");
			expect(result.contents[0].text).not.toContain("Post 11");
		});

		test("should handle blog posts with empty feed", async () => {
			(fetchAndParseRSS as jest.Mock).mockResolvedValue({
				posts: [],
				totalFound: 0,
			});

			const mockUri = new URL("duyet://blog/posts/1");
			const result = await resourceHandler(mockUri, { limit: "1" });

			expect(result.contents[0].text).toContain("No blog posts found");
		});
	});

	describe("CV Resource Edge Cases", () => {
		let resourceHandler: any;
		beforeAll(() => {
			resourceHandler = mockServer.getResourceHandler("cv");
		});

		test("should return summary for invalid format", async () => {
			const mockUri = new URL("duyet://cv/invalid-format");
			const result = await resourceHandler(mockUri, {
				format: "invalid-format",
			});
			expect(result.contents[0].text).toContain("Sr. Data Engineer");
		});
	});

	describe("GitHub Activity Resource Edge Cases", () => {
		let resourceHandler: any;
		beforeAll(() => {
			resourceHandler = mockServer.getResourceHandler("github-activity");
		});

		test("should handle GitHub API rate limit error", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
				status: 403,
				statusText: "Forbidden",
			});

			const mockUri = new URL("duyet://github/activity");
			const result = await resourceHandler(mockUri, {});

			expect(result.contents[0].text).toContain(
				"Error fetching GitHub activity: GitHub API error: 403",
			);
		});

		test("should handle GitHub event with empty repository name", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => [
					{
						type: "PushEvent",
						repo: { name: "" },
						payload: { commits: [{ message: "test" }] },
						created_at: "2024-07-25T10:00:00Z",
					},
				],
			});

			const mockUri = new URL("duyet://github/activity");
			const result = await resourceHandler(mockUri, {});

			expect(result.contents[0].text).toContain("Pushed 1 commit in  (7/25/2024)");
		});

		test("should handle GitHub activity with limit bounds", async () => {
			const allEvents = Array.from({ length: 25 }, (_, i) => ({
				type: "WatchEvent",
				actor: { login: `user${i}` },
				repo: { name: `repo${i}` },
				created_at: new Date().toISOString(),
			}));

			(global.fetch as jest.Mock).mockImplementation(async (url: string) => {
				const perPage = new URL(url).searchParams.get("per_page");
				const limit = perPage ? Number.parseInt(perPage, 10) : allEvents.length;
				return {
					ok: true,
					json: async () => allEvents.slice(0, limit),
				};
			});

			// Test limit > 20
			const mockUri1 = new URL("duyet://github/activity/100");
			const result1 = await resourceHandler(mockUri1, { limit: "100" });
			expect(result1.contents[0].text).toContain("repo19");
			expect(result1.contents[0].text).not.toContain("repo20");

			// Test limit < 1 (defaults to 5)
			const mockUri2 = new URL("duyet://github/activity/0");
			const result2 = await resourceHandler(mockUri2, { limit: "0" });
			expect(result2.contents[0].text).toContain("repo4");
			expect(result2.contents[0].text).not.toContain("repo5");
		});

		test("should handle no recent github activity", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => [],
			});

			const mockUri = new URL("duyet://github/activity/5");
			const result = await resourceHandler(mockUri, { limit: "5" });

			expect(result.contents[0].text).toContain("No recent GitHub activity found.");
		});
	});

	describe("Comprehensive Edge Case Scenarios", () => {
		let contactsHandler: any;
		let blogPostsHandler: any;
		let cvHandler: any;
		let githubActivityHandler: any;
		const { fetchAndParseRSS } = jest.requireMock("../tools/get-latest-blog-post");

		beforeAll(() => {
			contactsHandler = mockServer.getResourceHandler("contacts");
			blogPostsHandler = mockServer.getResourceHandler("blog-posts");
			cvHandler = mockServer.getResourceHandler("cv");
			githubActivityHandler = mockServer.getResourceHandler("github-activity");
		});

		test("should correctly handle sequential calls to different resources with mixed success and failure", async () => {
			// 1. Successful CV request
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				text: async () => "<title>Duyet - Senior Data Engineer</title>",
			});
			const cvUri = new URL("duyet://cv/summary");
			const cvResult = await cvHandler(cvUri, { format: "summary" });
			expect(cvResult.contents[0].text).toContain("Sr. Data Engineer");

			// 2. Failed GitHub request (rate limited)
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
				status: 403,
				statusText: "Forbidden",
			});
			const githubUri = new URL("duyet://github/activity");
			const githubResult = await githubActivityHandler(githubUri, {});
			expect(githubResult.contents[0].text).toContain(
				"Error fetching GitHub activity: GitHub API error: 403",
			);

			// 3. Successful Blog post request (but empty)
			(fetchAndParseRSS as jest.Mock).mockResolvedValue({
				posts: [],
				totalFound: 0,
			});
			const blogUri = new URL("duyet://blog/posts/1");
			const blogResult = await blogPostsHandler(blogUri, { limit: "1" });
			expect(blogResult.contents[0].text).toBe("No blog posts found");

			// 4. Successful Contacts request
			jest.clearAllMocks();
			(getDb as jest.Mock).mockReturnValue({
				select: jest.fn().mockReturnThis(),
				from: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				limit: jest.fn().mockResolvedValue([
					{
						id: 1,
						message: "Hello",
						purpose: "general_inquiry",
						createdAt: new Date(),
					},
				]),
			});
			const contactsUri = new URL("duyet://contacts");
			const contactsResult = await contactsHandler(contactsUri, {});
			expect(contactsResult.contents[0].text).toContain("Contact Submissions");
			expect(contactsResult.contents[0].text).toContain("Hello");
		});
	});
});
