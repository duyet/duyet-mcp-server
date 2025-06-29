// Mock the github-activity resource to avoid ESM import issues
jest.mock("../resources/github-activity", () => ({
	registerGitHubActivityResource: jest.fn(),
}));

import { registerAllResources } from "../resources/index";

// Mock fetch globally
global.fetch = jest.fn();

// Mock the McpServer
const mockServer = {
	registerResource: jest.fn(),
} as any;

// Mock environment
const mockEnv = {
	DB: {} as D1Database,
} as Env;

describe("Resource Registration Coverage Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Mock fetch responses
		(global.fetch as jest.Mock).mockResolvedValue({
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
		});
	});

	test("should register all resources and call them", () => {
		registerAllResources(mockServer, mockEnv);
		// Should have called resource registration for 3 resources (github-activity is mocked)
		expect(mockServer.registerResource).toHaveBeenCalledTimes(3);

		// Verify all resource types were registered
		const registeredNames = (mockServer.registerResource as jest.Mock).mock.calls.map(
			(call) => call[0],
		);
		expect(registeredNames).toEqual(
			expect.arrayContaining([
				"about-duyet",
				"cv",
				"blog-posts",
			]),
		);
	});
});
