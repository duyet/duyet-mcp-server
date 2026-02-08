import { describe, expect, test, beforeEach, mock, type Mock } from "bun:test";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerLlmsTxtResource } from "../resources/llms-txt";

// Mock fetch globally
const mockFetch = mock((_input: RequestInfo | URL, _init?: RequestInit) =>
	Promise.resolve({} as Response),
);
globalThis.fetch = mockFetch as unknown as typeof fetch;

// Create mock server factory
const createMockServer = () =>
	({
		registerResource: mock(() => undefined),
	}) as unknown as McpServer & { registerResource: Mock<(...args: unknown[]) => unknown> };

describe("llms.txt Resource Tests", () => {
	let mockServer: ReturnType<typeof createMockServer>;

	beforeEach(() => {
		mockServer = createMockServer();
		mockFetch.mockClear();
	});

	test("should register llms-txt resource with correct parameters", () => {
		registerLlmsTxtResource(mockServer);

		expect(mockServer.registerResource).toHaveBeenCalledWith(
			"llms-txt",
			"duyet://blog/llms.txt",
			expect.objectContaining({
				title: "Duyet's Blog llms.txt",
				description: expect.stringContaining("Comprehensive markdown index"),
				mimeType: "text/plain",
			}),
			expect.any(Function),
		);
	});

	test("should fetch and return llms.txt content successfully", async () => {
		const mockLlmsTxtContent = `# Duyet's Blog Index

## Latest Posts
- [Post 1](https://blog.duyet.net/2024/post-1.html) - Description
- [Post 2](https://blog.duyet.net/2024/post-2.html) - Description
`;

		mockFetch.mockResolvedValue({
			ok: true,
			text: async () => mockLlmsTxtContent,
		} as Response);

		let resourceHandler: any;
		mockServer.registerResource.mockImplementation((_name, _uri, _metadata, handler) => {
			resourceHandler = handler;
		});

		registerLlmsTxtResource(mockServer);
		const result = await resourceHandler(new URL("duyet://blog/llms.txt"));

		expect(result.contents).toHaveLength(1);
		expect(result.contents[0].uri).toBe("duyet://blog/llms.txt");
		expect(result.contents[0].text).toContain("Duyet's Blog Index");
		expect(result.contents[0].text).toContain("Post 1");
		expect(result.contents[0].text).toContain("Post 2");
	});

	test("should handle HTTP error when fetching llms.txt", async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			status: 404,
			statusText: "Not Found",
		} as Response);

		let resourceHandler: any;
		mockServer.registerResource.mockImplementation((_name, _uri, _metadata, handler) => {
			resourceHandler = handler;
		});

		registerLlmsTxtResource(mockServer);
		const result = await resourceHandler(new URL("duyet://blog/llms.txt"));

		expect(result.contents[0].text).toContain("Error fetching llms.txt");
		expect(result.contents[0].text).toContain("HTTP 404");
	});

	test("should handle network error when fetching llms.txt", async () => {
		mockFetch.mockRejectedValue(new Error("Network timeout"));

		let resourceHandler: any;
		mockServer.registerResource.mockImplementation((_name, _uri, _metadata, handler) => {
			resourceHandler = handler;
		});

		registerLlmsTxtResource(mockServer);
		const result = await resourceHandler(new URL("duyet://blog/llms.txt"));

		expect(result.contents[0].text).toContain("Error fetching llms.txt");
		expect(result.contents[0].text).toContain("Network timeout");
	});

	test("should verify resource registration has correct URI and metadata", () => {
		registerLlmsTxtResource(mockServer);

		const registerCall = mockServer.registerResource.mock.calls[0] as [
			string,
			string,
			{ title: string; description: string; mimeType: string },
			(...args: unknown[]) => unknown,
		];
		const [name, uri, metadata, handler] = registerCall;

		expect(name).toBe("llms-txt");
		expect(uri).toBe("duyet://blog/llms.txt");
		expect(metadata.title).toBe("Duyet's Blog llms.txt");
		expect(metadata.description).toContain("LLM consumption");
		expect(metadata.mimeType).toBe("text/plain");
		expect(typeof handler).toBe("function");
	});

	test("should fetch from correct URL", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			text: async () => "# Test Content",
		} as Response);

		let resourceHandler: any;
		mockServer.registerResource.mockImplementation((_name, _uri, _metadata, handler) => {
			resourceHandler = handler;
		});

		registerLlmsTxtResource(mockServer);
		await resourceHandler(new URL("duyet://blog/llms.txt"));

		expect(mockFetch).toHaveBeenCalledWith("https://blog.duyet.net/llms.txt");
	});
});
