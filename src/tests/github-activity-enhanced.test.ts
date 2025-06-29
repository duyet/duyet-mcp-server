import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGitHubActivityTool } from "../tools/github-activity";

// Mock Octokit
const mockListPublicEventsForUser = jest.fn();
jest.mock("@octokit/rest", () => ({
	Octokit: jest.fn().mockImplementation(() => ({
		rest: {
			activity: {
				listPublicEventsForUser: mockListPublicEventsForUser,
			},
		},
	})),
}));

// Mock the McpServer
const mockServer = {
	registerTool: jest.fn(),
} as unknown as McpServer;

describe("GitHub Activity Tool Enhanced Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("should register github-activity tool with all parameters", () => {
		registerGitHubActivityTool(mockServer);
		expect(mockServer.registerTool).toHaveBeenCalledWith(
			"github_activity",
			expect.objectContaining({
				title: "GitHub Activity",
				description: expect.stringContaining("Get Duyet's recent GitHub activity"),
				inputSchema: expect.objectContaining({
					limit: expect.any(Object),
					include_details: expect.any(Object),
				}),
			}),
			expect.any(Function),
		);
	});

	test("should handle WatchEvent type", async () => {
		const mockEvents = [
			{
				type: "WatchEvent",
				created_at: "2024-01-01T00:00:00Z",
				repo: { name: "duyet/test-repo" },
				payload: {},
			},
		];

		mockListPublicEventsForUser.mockResolvedValue({
			data: mockEvents,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation(
			(name, _config, handler) => {
				if (name === "github_activity") {
					toolHandler = handler;
				}
			},
		);

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: false });

		expect(result.content[0].text).toContain("Starred repository");
		expect(result.content[0].text).toContain("duyet/test-repo");
	});

	test("should handle ForkEvent type", async () => {
		const mockEvents = [
			{
				type: "ForkEvent",
				created_at: "2024-01-01T00:00:00Z",
				repo: { name: "duyet/test-repo" },
				payload: {},
			},
		];

		mockListPublicEventsForUser.mockResolvedValue({
			data: mockEvents,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation(
			(name, _config, handler) => {
				if (name === "github_activity") {
					toolHandler = handler;
				}
			},
		);

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: false });

		expect(result.content[0].text).toContain("Forked repository");
		expect(result.content[0].text).toContain("duyet/test-repo");
	});

	test("should handle ReleaseEvent type", async () => {
		const mockEvents = [
			{
				type: "ReleaseEvent",
				created_at: "2024-01-01T00:00:00Z",
				repo: { name: "duyet/test-repo" },
				payload: {
					action: "published",
					release: {
						tag_name: "v1.0.0",
						name: "Version 1.0.0",
						published_at: "2024-01-01T00:00:00Z",
					},
				},
			},
		];

		mockListPublicEventsForUser.mockResolvedValue({
			data: mockEvents,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation(
			(name, _config, handler) => {
				if (name === "github_activity") {
					toolHandler = handler;
				}
			},
		);

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: true });

		expect(result.content[0].text).toContain("published release");
		expect(result.content[0].text).toContain("v1.0.0: Version 1.0.0");
	});

	test("should handle ReleaseEvent without payload", async () => {
		const mockEvents = [
			{
				type: "ReleaseEvent",
				created_at: "2024-01-01T00:00:00Z",
				repo: { name: "duyet/test-repo" },
				payload: {},
			},
		];

		mockListPublicEventsForUser.mockResolvedValue({
			data: mockEvents,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation(
			(name, _config, handler) => {
				if (name === "github_activity") {
					toolHandler = handler;
				}
			},
		);

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: false });

		expect(result.content[0].text).toContain("created release");
	});

	test("should handle CreateEvent without ref", async () => {
		const mockEvents = [
			{
				type: "CreateEvent",
				created_at: "2024-01-01T00:00:00Z",
				repo: { name: "duyet/test-repo" },
				payload: { ref_type: "repository" },
			},
		];

		mockListPublicEventsForUser.mockResolvedValue({
			data: mockEvents,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation(
			(name, _config, handler) => {
				if (name === "github_activity") {
					toolHandler = handler;
				}
			},
		);

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: false });

		expect(result.content[0].text).toContain("Created repository");
	});

	test("should handle PushEvent without commits", async () => {
		const mockEvents = [
			{
				type: "PushEvent",
				created_at: "2024-01-01T00:00:00Z",
				repo: { name: "duyet/test-repo" },
				payload: { commits: [] },
			},
		];

		mockListPublicEventsForUser.mockResolvedValue({
			data: mockEvents,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation(
			(name, _config, handler) => {
				if (name === "github_activity") {
					toolHandler = handler;
				}
			},
		);

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: false });

		expect(result.content[0].text).toContain("Pushed 0 commit");
	});

	test("should handle missing payloads gracefully", async () => {
		const mockEvents = [
			{
				type: "IssuesEvent",
				created_at: "2024-01-01T00:00:00Z",
				repo: { name: "duyet/test-repo" },
				payload: {},
			},
			{
				type: "PullRequestEvent",
				created_at: "2024-01-01T00:00:00Z",
				repo: { name: "duyet/test-repo" },
				payload: {},
			},
		];

		mockListPublicEventsForUser.mockResolvedValue({
			data: mockEvents,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation(
			(name, _config, handler) => {
				if (name === "github_activity") {
					toolHandler = handler;
				}
			},
		);

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: false });

		expect(result.content[0].text).toContain("updated issue");
		expect(result.content[0].text).toContain("updated pull request");
	});

	test("should handle GitHub API error", async () => {
		mockListPublicEventsForUser.mockRejectedValue(
			new Error("GitHub API error: 404")
		);

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation(
			(name, _config, handler) => {
				if (name === "github_activity") {
					toolHandler = handler;
				}
			},
		);

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: false });

		expect(result.content[0].text).toContain("Error fetching GitHub activity");
		expect(result.content[0].text).toContain("GitHub API error: 404");
	});

	test("should handle empty events array", async () => {
		mockListPublicEventsForUser.mockResolvedValue({
			data: [],
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation(
			(name, _config, handler) => {
				if (name === "github_activity") {
					toolHandler = handler;
				}
			},
		);

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: false });

		expect(result.content[0].text).toContain("No recent GitHub activity found");
	});

	test("should limit results correctly", async () => {
		const mockEvents = Array.from({ length: 25 }, (_, i) => ({
			type: "PushEvent",
			created_at: `2024-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
			repo: { name: `duyet/test-repo-${i}` },
			payload: { commits: [{ message: `Commit ${i}`, sha: `sha${i}` }] },
		}));

		mockListPublicEventsForUser.mockResolvedValue({
			data: mockEvents,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation(
			(name, _config, handler) => {
				if (name === "github_activity") {
					toolHandler = handler;
				}
			},
		);

		registerGitHubActivityTool(mockServer);
		const _result = await toolHandler({ limit: 25, include_details: false });

		// Should limit to 20 max
		expect(mockListPublicEventsForUser).toHaveBeenCalledWith({
			username: "duyet",
			per_page: 20,
		});
	});

	test("should handle invalid limit parameter", async () => {
		const mockEvents = [
			{
				type: "PushEvent",
				created_at: "2024-01-01T00:00:00Z",
				repo: { name: "duyet/test-repo" },
				payload: { commits: [] },
			},
		];

		mockListPublicEventsForUser.mockResolvedValue({
			data: mockEvents,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation(
			(name, _config, handler) => {
				if (name === "github_activity") {
					toolHandler = handler;
				}
			},
		);

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ include_details: false }); // Test default value

		// Should default to 5
		expect(mockListPublicEventsForUser).toHaveBeenCalledWith({
			username: "duyet",
			per_page: 5,
		});
		expect(result.content[0].text).toContain("Recent GitHub Activity");
	});

	test("should handle unknown event types", async () => {
		const mockEvents = [
			{
				type: "UnknownEvent",
				created_at: "2024-01-01T00:00:00Z",
				repo: { name: "duyet/test-repo" },
				payload: {},
			},
		];

		mockListPublicEventsForUser.mockResolvedValue({
			data: mockEvents,
		});

		let toolHandler: any;
		(mockServer.registerTool as jest.Mock).mockImplementation(
			(name, _config, handler) => {
				if (name === "github_activity") {
					toolHandler = handler;
				}
			},
		);

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: false });

		expect(result.content[0].text).toContain("Unknown");
	});
}); 