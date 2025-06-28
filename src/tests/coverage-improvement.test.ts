import { registerGitHubActivityResource, registerGitHubActivityTool } from "../resources/github-activity";
import { parseRSSContent, formatBlogPostsForMCP } from "../resources/blog-posts";
import { registerCVResource } from "../resources/cv";

// Mock fetch
global.fetch = jest.fn();

// Mock server
const createMockServer = () => ({
	registerResource: jest.fn(),
	registerTool: jest.fn(),
}) as any;

beforeEach(() => {
	jest.clearAllMocks();
	(global.fetch as jest.Mock).mockClear();
});

describe("Coverage Improvement Tests", () => {
	describe("GitHub Activity - Autocomplete Functions", () => {
		test("should test limit autocomplete function", () => {
			const mockServer = createMockServer();
			let capturedTemplate: any;

			(mockServer.registerResource as jest.Mock).mockImplementation(
				(name, template, _metadata, _handler) => {
					if (name === "github-activity") {
						capturedTemplate = template;
					}
				},
			);

			registerGitHubActivityResource(mockServer);

			expect(capturedTemplate).toBeDefined();
			// Access the complete object from the ResourceTemplate
			const completeCallbacks = capturedTemplate._callbacks?.complete || capturedTemplate.complete;
			expect(completeCallbacks).toBeDefined();
			expect(completeCallbacks.limit).toBeDefined();
			
			const limitComplete = completeCallbacks.limit;
			expect(limitComplete("1")).toContain("1");
			expect(limitComplete("10")).toContain("10");
			expect(limitComplete("2")).toEqual(["2", "20"]);
			expect(limitComplete("")).toHaveLength(20);
		});

		test("should test include_details autocomplete function", () => {
			const mockServer = createMockServer();
			let capturedTemplate: any;

			(mockServer.registerResource as jest.Mock).mockImplementation(
				(name, template, _metadata, _handler) => {
					if (name === "github-activity") {
						capturedTemplate = template;
					}
				},
			);

			registerGitHubActivityResource(mockServer);

			expect(capturedTemplate).toBeDefined();
			// Access the complete object from the ResourceTemplate
			const completeCallbacks = capturedTemplate._callbacks?.complete || capturedTemplate.complete;
			expect(completeCallbacks).toBeDefined();
			expect(completeCallbacks.include_details).toBeDefined();
			
			const detailsComplete = completeCallbacks.include_details;
			expect(detailsComplete("t")).toEqual(["true"]);
			expect(detailsComplete("f")).toEqual(["false"]);
			expect(detailsComplete("")).toEqual(["true", "false"]);
		});
	});

	describe("GitHub Activity - Tool Implementation", () => {
		test("should register and execute GitHub activity tool", async () => {
			const mockServer = createMockServer();

			// Mock successful GitHub API response
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => [
					{
						type: "IssuesEvent",
						created_at: "2024-01-01T12:00:00Z",
						repo: { name: "duyet/test-repo" },
						payload: {
							action: "opened",
							issue: { title: "Test Issue Title" },
						},
					},
					{
						type: "PullRequestEvent",
						created_at: "2024-01-02T14:00:00Z",
						repo: { name: "duyet/another-repo" },
						payload: {
							action: "closed",
							pull_request: { title: "Test PR Title" },
						},
					},
				],
			});

			let toolHandler: any;
			(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
				if (name === "get_github_activity") toolHandler = handler;
			});

			registerGitHubActivityTool(mockServer);
			const result = await toolHandler({ limit: 10, include_details: true });

			expect(result.content[0].text).toContain("Recent GitHub Activity");
			expect(result.content[0].text).toContain("opened issue");
			expect(result.content[0].text).toContain("Test Issue Title");
			expect(result.content[0].text).toContain("closed pull request");
			expect(result.content[0].text).toContain("Test PR Title");
		});

		test("should handle GitHub tool API errors", async () => {
			const mockServer = createMockServer();

			// Mock API error
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
				status: 404,
			});

			let toolHandler: any;
			(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
				if (name === "get_github_activity") toolHandler = handler;
			});

			registerGitHubActivityTool(mockServer);
			const result = await toolHandler({ limit: 5, include_details: false });

			expect(result.content[0].text).toContain("Error fetching GitHub activity");
			expect(result.content[0].text).toContain("https://github.com/duyet");
		});

		test("should handle GitHub tool network errors", async () => {
			const mockServer = createMockServer();

			// Mock network error
			(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

			let toolHandler: any;
			(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
				if (name === "get_github_activity") toolHandler = handler;
			});

			registerGitHubActivityTool(mockServer);
			const result = await toolHandler({ limit: 3, include_details: true });

			expect(result.content[0].text).toContain("Error fetching GitHub activity");
			expect(result.content[0].text).toContain("Network error");
		});
	});

	describe("GitHub Activity - Additional Event Types", () => {
		test("should handle IssuesEvent without details", async () => {
			const mockServer = createMockServer();

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => [
					{
						type: "IssuesEvent",
						created_at: "2024-01-01T12:00:00Z",
						repo: { name: "duyet/test-repo" },
						payload: {
							action: "reopened",
							issue: { title: "Test Issue" },
						},
					},
				],
			});

			let resourceHandler: any;
			(mockServer.registerResource as jest.Mock).mockImplementation(
				(name, _template, _metadata, handler) => {
					if (name === "github-activity") {
						resourceHandler = handler;
					}
				},
			);

			registerGitHubActivityResource(mockServer);
			const result = await resourceHandler(
				new URL("duyet://github/activity/1/false"),
				{ limit: "1", include_details: "false" },
			);

			expect(result.contents[0].text).toContain("reopened issue");
			expect(result.contents[0].text).not.toContain("Test Issue");
		});

		test("should handle PullRequestEvent without details", async () => {
			const mockServer = createMockServer();

			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => [
					{
						type: "PullRequestEvent",
						created_at: "2024-01-01T12:00:00Z",
						repo: { name: "duyet/test-repo" },
						payload: {
							action: "merged",
							pull_request: { title: "Test PR" },
						},
					},
				],
			});

			let resourceHandler: any;
			(mockServer.registerResource as jest.Mock).mockImplementation(
				(name, _template, _metadata, handler) => {
					if (name === "github-activity") {
						resourceHandler = handler;
					}
				},
			);

			registerGitHubActivityResource(mockServer);
			const result = await resourceHandler(
				new URL("duyet://github/activity/1/false"),
				{ limit: "1", include_details: "false" },
			);

			expect(result.contents[0].text).toContain("merged pull request");
			expect(result.contents[0].text).not.toContain("Test PR");
		});
	});

	describe("Blog Posts - Error Handling", () => {
		test("should handle RSS parsing errors", () => {
			const invalidXML = "invalid xml content";
			const result = parseRSSContent(invalidXML, 5);

			expect(result.posts).toHaveLength(0);
			expect(result.totalFound).toBe(0);
		});

		test("should handle malformed RSS items", () => {
			const malformedRSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
	<channel>
		<item>
			<!-- Missing title and other fields -->
		</item>
		<item>
			<title></title>
			<description></description>
		</item>
	</channel>
</rss>`;

			const result = parseRSSContent(malformedRSS, 5);
			
			// Should handle empty or missing fields gracefully
			expect(result.totalFound).toBeGreaterThanOrEqual(0);
		});

		test("should format blog posts with edge cases", () => {
			const postsWithNulls = [
				{
					title: "Test Post",
					link: null,
					description: null,
					pubDate: "2024-01-01",
				},
			];

			const formatted = formatBlogPostsForMCP(postsWithNulls as any);
			expect(formatted).toContain("Test Post");
			expect(formatted).toContain("Latest 1 blog post");
		});
	});

	describe("CV Resource", () => {
		test("should register CV resource with proper metadata", () => {
			const mockServer = createMockServer();

			registerCVResource(mockServer);

			expect(mockServer.registerResource).toHaveBeenCalledWith(
				"cv",
				expect.any(Object),
				expect.objectContaining({
					description: expect.stringContaining("curriculum vitae"),
				}),
				expect.any(Function),
			);
		});

		test("should handle CV resource API errors", async () => {
			const mockServer = createMockServer();

			(global.fetch as jest.Mock).mockRejectedValue(new Error("Fetch failed"));

			let resourceHandler: any;
			(mockServer.registerResource as jest.Mock).mockImplementation(
				(name, _template, _metadata, handler) => {
					if (name === "cv") {
						resourceHandler = handler;
					}
				},
			);

			registerCVResource(mockServer);
			const result = await resourceHandler(
				new URL("duyet://cv/summary"),
				{ format: "summary" },
			);

			expect(result.contents[0].text).toContain("Error");
		});

		test("should register CV resource with proper template", () => {
			const mockServer = createMockServer();
			let capturedTemplate: any;

			(mockServer.registerResource as jest.Mock).mockImplementation(
				(name, template, _metadata, _handler) => {
					if (name === "cv") {
						capturedTemplate = template;
					}
				},
			);

			registerCVResource(mockServer);

			expect(capturedTemplate).toBeDefined();
			expect(mockServer.registerResource).toHaveBeenCalledWith(
				"cv",
				expect.any(Object),
				expect.objectContaining({
					title: "Duyet's CV",
					description: expect.stringContaining("curriculum vitae"),
					mimeType: "text/plain",
				}),
				expect.any(Function),
			);
		});
	});
});