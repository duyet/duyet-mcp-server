import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGitHubActivityTool } from "../tools/github-activity";

// Mock fetch globally
global.fetch = jest.fn();

// Mock the McpServer
const mockServer = {
	registerTool: jest.fn(),
} as unknown as McpServer;

describe("GitHub Activity Tool Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("should register github-activity tool", () => {
		registerGitHubActivityTool(mockServer);
		expect(mockServer.registerTool).toHaveBeenCalledWith(
			"get_github_activity",
			expect.objectContaining({
				title: "Get GitHub Activity",
				description: expect.stringContaining("recent GitHub activity"),
			}),
			expect.any(Function),
		);
	});

	test("should handle successful GitHub API response", async () => {
		const mockEvents = [
			{
				type: "PushEvent",
				created_at: "2024-01-01T00:00:00Z",
				repo: { name: "duyet/test-repo" },
				payload: {
					commits: [
						{ message: "Initial commit", sha: "abc123" },
						{ message: "Add feature", sha: "def456" },
					],
				},
			},
			{
				type: "CreateEvent",
				created_at: "2024-01-02T00:00:00Z",
				repo: { name: "duyet/another-repo" },
				payload: { ref_type: "branch", ref: "feature-branch" },
			},
		];

		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => mockEvents,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_github_activity") {
				toolHandler = handler;
			}
		});

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: false });

		expect(result.content[0].text).toContain("Recent GitHub Activity");
		expect(result.content[0].text).toContain("Pushed");
		expect(result.content[0].text).toContain("duyet/test-repo");
	});

	test("should handle response with details", async () => {
		const mockEvents = [
			{
				type: "PushEvent",
				created_at: "2024-01-01T00:00:00Z",
				repo: { name: "duyet/test-repo" },
				payload: {
					commits: [{ message: "Initial commit", sha: "abc123" }],
				},
			},
		];

		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => mockEvents,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_github_activity") {
				toolHandler = handler;
			}
		});

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 3, include_details: true });

		expect(result.content[0].text).toContain("Recent GitHub Activity");
		expect(result.content[0].text).toContain("Initial commit");
	});

	test("should handle IssuesEvent type", async () => {
		const mockEvents = [
			{
				type: "IssuesEvent",
				created_at: "2024-01-01T00:00:00Z",
				repo: { name: "duyet/test-repo" },
				payload: {
					action: "opened",
					issue: { title: "Bug report", number: 42 },
				},
			},
		];

		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => mockEvents,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_github_activity") {
				toolHandler = handler;
			}
		});

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: true });

		expect(result.content[0].text).toContain("opened issue");
		expect(result.content[0].text).toContain("Bug report");
	});

	test("should handle PullRequestEvent type", async () => {
		const mockEvents = [
			{
				type: "PullRequestEvent",
				created_at: "2024-01-01T00:00:00Z",
				repo: { name: "duyet/test-repo" },
				payload: {
					action: "merged",
					pull_request: { title: "Add new feature", number: 123 },
				},
			},
		];

		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => mockEvents,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_github_activity") {
				toolHandler = handler;
			}
		});

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: true });

		expect(result.content[0].text).toContain("merged pull request");
		expect(result.content[0].text).toContain("Add new feature");
	});

	test("should handle CreateEvent type", async () => {
		const mockEvents = [
			{
				type: "CreateEvent",
				created_at: "2024-01-01T00:00:00Z",
				repo: { name: "duyet/test-repo" },
				payload: { ref_type: "tag", ref: "v1.0.0" },
			},
		];

		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => mockEvents,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_github_activity") {
				toolHandler = handler;
			}
		});

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: true });

		expect(result.content[0].text).toContain("Created tag");
	});

	test("should handle unknown event type", async () => {
		const mockEvents = [
			{
				type: "UnknownEvent",
				created_at: "2024-01-01T00:00:00Z",
				repo: { name: "duyet/test-repo" },
				payload: {},
			},
		];

		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => mockEvents,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_github_activity") {
				toolHandler = handler;
			}
		});

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: true });

		expect(result.content[0].text).toContain("Unknown");
	});

	test("should handle network error", async () => {
		(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_github_activity") {
				toolHandler = handler;
			}
		});

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: false });

		expect(result.content[0].text).toContain("Error fetching GitHub activity");
		expect(result.content[0].text).toContain("Network error");
	});

	test("should handle HTTP error response", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: false,
			status: 403,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_github_activity") {
				toolHandler = handler;
			}
		});

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: false });

		expect(result.content[0].text).toContain("Error fetching GitHub activity");
		expect(result.content[0].text).toContain("403");
	});

	test("should handle empty events array", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => [],
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_github_activity") {
				toolHandler = handler;
			}
		});

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: false });

		expect(result.content[0].text).toContain("No recent GitHub activity");
	});

	test("should handle default parameters", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => [],
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation((name, _config, handler) => {
			if (name === "get_github_activity") {
				toolHandler = handler;
			}
		});

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({});

		expect(result.content[0].text).toContain("No recent GitHub activity");
	});
});
