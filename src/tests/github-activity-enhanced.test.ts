import { describe, expect, test, beforeEach, mock, type Mock } from "bun:test";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGitHubActivityTool } from "../tools/github-activity";

// Mock fetch globally
const mockFetch = mock(() => Promise.resolve({} as Response));
globalThis.fetch = mockFetch as unknown as typeof fetch;

// Create mock server factory
const createMockServer = () =>
	({
		registerTool: mock(() => undefined),
	}) as unknown as McpServer & { registerTool: Mock<(...args: unknown[]) => unknown> };

// Helper to create mock response
const createMockResponse = (data: unknown, ok = true, status = 200) =>
	({
		ok,
		status,
		statusText: ok ? "OK" : "Not Found",
		json: mock(() => Promise.resolve(data)),
	}) as unknown as Response;

describe("GitHub Activity Tool Enhanced Tests", () => {
	let mockServer: ReturnType<typeof createMockServer>;

	beforeEach(() => {
		mockServer = createMockServer();
		mockFetch.mockClear();
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

		mockFetch.mockResolvedValue(createMockResponse(mockEvents));

		let toolHandler: any;
		mockServer.registerTool.mockImplementation((name, _config, handler) => {
			if (name === "github_activity") {
				toolHandler = handler;
			}
		});

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

		mockFetch.mockResolvedValue(createMockResponse(mockEvents));

		let toolHandler: any;
		mockServer.registerTool.mockImplementation((name, _config, handler) => {
			if (name === "github_activity") {
				toolHandler = handler;
			}
		});

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
					},
				},
			},
		];

		mockFetch.mockResolvedValue(createMockResponse(mockEvents));

		let toolHandler: any;
		mockServer.registerTool.mockImplementation((name, _config, handler) => {
			if (name === "github_activity") {
				toolHandler = handler;
			}
		});

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: true });

		expect(result.content[0].text).toContain("published release");
		expect(result.content[0].text).toContain("v1.0.0: Version 1.0.0");
	});

	test("should handle GitHub API error", async () => {
		mockFetch.mockResolvedValue(createMockResponse(null, false, 404));

		let toolHandler: any;
		mockServer.registerTool.mockImplementation((name, _config, handler) => {
			if (name === "github_activity") {
				toolHandler = handler;
			}
		});

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: false });

		expect(result.content[0].text).toContain("Error fetching GitHub activity");
		expect(result.content[0].text).toContain("404");
	});

	test("should handle empty events array", async () => {
		mockFetch.mockResolvedValue(createMockResponse([]));

		let toolHandler: any;
		mockServer.registerTool.mockImplementation((name, _config, handler) => {
			if (name === "github_activity") {
				toolHandler = handler;
			}
		});

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: false });

		expect(result.content[0].text).toContain("No recent GitHub activity found");
	});

	test("should handle network error", async () => {
		mockFetch.mockRejectedValue(new Error("Network error"));

		let toolHandler: any;
		mockServer.registerTool.mockImplementation((name, _config, handler) => {
			if (name === "github_activity") {
				toolHandler = handler;
			}
		});

		registerGitHubActivityTool(mockServer);
		const result = await toolHandler({ limit: 5, include_details: false });

		expect(result.content[0].text).toContain("Error fetching GitHub activity");
	});
});
