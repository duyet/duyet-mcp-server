import { describe, expect, test, beforeEach, mock, type Mock } from "bun:test";
import { registerAllResources } from "../resources/index";

// Mock fetch globally
const mockFetch = mock(() => Promise.resolve({} as Response));
globalThis.fetch = mockFetch as unknown as typeof fetch;

// Mock the McpServer
const createMockServer = () =>
	({
		registerResource: mock(() => undefined),
	}) as unknown as { registerResource: Mock<(...args: unknown[]) => unknown> };

// Mock environment
const mockEnv = {
	DB: {} as D1Database,
} as Env;

describe("Resource Registration Coverage Tests", () => {
	let mockServer: ReturnType<typeof createMockServer>;

	beforeEach(() => {
		mockServer = createMockServer();
		mockFetch.mockClear();
		// Mock fetch responses
		mockFetch.mockResolvedValue({
			ok: true,
			status: 200,
			text: async () => `<?xml version="1.0"?>
                <rss version="2.0">
                    <channel>
                        <title>Duyet's Blog</title>
                        <item>
                            <title>Test Post</title>
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
		} as Response);
	});

	test("should register all resources and call them", () => {
		registerAllResources(mockServer as any, mockEnv);
		// Should have called resource registration for 4 resources
		expect(mockServer.registerResource).toHaveBeenCalledTimes(4);

		// Verify all resource types were registered
		const registeredNames = mockServer.registerResource.mock.calls.map((call) => call[0]);
		expect(registeredNames).toEqual(
			expect.arrayContaining(["about-duyet", "cv", "blog-posts", "github-activity"]),
		);
	});
});
