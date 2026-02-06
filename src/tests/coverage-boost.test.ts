/**
 * Specific tests to boost coverage for under-tested files
 */
import { describe, expect, test, beforeEach, mock, type Mock } from "bun:test";
import { registerGetAnalyticsTool } from "../tools/contact-analytics";
import { registerGitHubActivityResource } from "../resources/github-activity";

// Mock fetch globally
const mockFetch = mock(() => Promise.resolve({} as Response));
globalThis.fetch = mockFetch as unknown as typeof fetch;

// Helper to create mock response
const createMockResponse = (data: unknown, ok = true, status = 200) =>
	({
		ok,
		status,
		statusText: ok ? "OK" : "Not Found",
		json: mock(() => Promise.resolve(data)),
	}) as unknown as Response;

const createMockServer = () =>
	({
		registerTool: mock(() => undefined),
		registerResource: mock(() => undefined),
	}) as unknown as {
		registerTool: Mock<(...args: unknown[]) => unknown>;
		registerResource: Mock<(...args: unknown[]) => unknown>;
	};

beforeEach(() => {
	mockFetch.mockClear();
});

describe("Coverage Boost Tests", () => {
	describe("Contact Analytics - Registration", () => {
		test("should register get_analytics tool", () => {
			const mockServer = createMockServer();
			const mockEnv = {
				DB: {} as D1Database,
				MCP_OBJECT: {} as DurableObjectNamespace,
				ANALYTICS: {} as AnalyticsEngineDataset,
			} as unknown as Env;

			registerGetAnalyticsTool(mockServer as any, mockEnv);

			expect(mockServer.registerTool).toHaveBeenCalledWith(
				"get_analytics",
				expect.any(Object),
				expect.any(Function),
			);
		});
	});

	describe("GitHub Activity - Success Paths", () => {
		test("should handle successful GitHub response with commits", async () => {
			const mockServer = createMockServer();

			// Mock fetch response
			mockFetch.mockResolvedValue(
				createMockResponse([
					{
						type: "PushEvent",
						created_at: "2024-01-01T12:00:00Z",
						repo: { name: "duyet/test-repo" },
						payload: {
							commits: [{ message: "Add new feature" }, { message: "Fix bug" }],
						},
					},
					{
						type: "IssuesEvent",
						created_at: "2024-01-02T14:00:00Z",
						repo: { name: "duyet/another-repo" },
						payload: { action: "opened" },
					},
				]),
			);

			let resourceHandler: any;
			mockServer.registerResource.mockImplementation(
				(name, _template, _metadata, handler) => {
					if (name === "github-activity") {
						resourceHandler = handler;
					}
				},
			);

			registerGitHubActivityResource(mockServer as any);
			const result = await resourceHandler(new URL("duyet://github/activity/10/true"), {
				limit: "10",
				include_details: "true",
			});

			expect(result.contents[0].text).toContain("Recent GitHub Activity");
			expect(result.contents[0].text).toContain("Pushed 2 commits");
			expect(result.contents[0].text).toContain("Add new feature");
		});

		test("should handle GitHub response without details", async () => {
			const mockServer = createMockServer();

			// Mock fetch response
			mockFetch.mockResolvedValue(
				createMockResponse([
					{
						type: "CreateEvent",
						created_at: "2024-01-03T16:00:00Z",
						repo: { name: "duyet/new-project" },
						payload: { ref_type: "branch" },
					},
				]),
			);

			let resourceHandler: any;
			mockServer.registerResource.mockImplementation(
				(name, _template, _metadata, handler) => {
					if (name === "github-activity") {
						resourceHandler = handler;
					}
				},
			);

			registerGitHubActivityResource(mockServer as any);
			const result = await resourceHandler(new URL("duyet://github/activity/5/false"), {
				limit: "5",
				include_details: "false",
			});

			expect(result.contents[0].text).toContain("Recent GitHub Activity");
			expect(result.contents[0].text).toContain("Created branch");
		});

		test("should handle different event types", async () => {
			const mockServer = createMockServer();

			// Mock fetch response
			mockFetch.mockResolvedValue(
				createMockResponse([
					{
						type: "WatchEvent",
						created_at: "2024-01-04T18:00:00Z",
						repo: { name: "duyet/starred-repo" },
						payload: { action: "started" },
					},
					{
						type: "ForkEvent",
						created_at: "2024-01-05T20:00:00Z",
						repo: { name: "duyet/forked-repo" },
						payload: {},
					},
				]),
			);

			let resourceHandler: any;
			mockServer.registerResource.mockImplementation(
				(name, _template, _metadata, handler) => {
					if (name === "github-activity") {
						resourceHandler = handler;
					}
				},
			);

			registerGitHubActivityResource(mockServer as any);
			const result = await resourceHandler(new URL("duyet://github/activity/2/true"), {
				limit: "2",
				include_details: "true",
			});

			expect(result.contents[0].text).toContain("Recent GitHub Activity");
			expect(result.contents[0].text).toContain("Starred repository");
			expect(result.contents[0].text).toContain("Forked repository");
		});
	});
});
