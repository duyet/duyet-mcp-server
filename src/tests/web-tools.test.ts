/**
 * Tests for web search and web fetch tools
 */
import { describe, expect, test, beforeEach, mock, type Mock } from "bun:test";
import { registerWebSearchTool } from "../tools/web-search";
import { registerWebFetchTool } from "../tools/web-fetch";

// Mock fetch
const mockFetch = mock(() => Promise.resolve({} as Response));
globalThis.fetch = mockFetch as unknown as typeof fetch;

// Mock MCP server
const createMockServer = () =>
	({
		registerTool: mock(() => undefined),
	}) as unknown as { registerTool: Mock<(...args: unknown[]) => unknown> };

beforeEach(() => {
	mockFetch.mockClear();
});

describe("Web Search Tool Tests", () => {
	test("should register web search tool", () => {
		const mockServer = createMockServer();
		registerWebSearchTool(mockServer as any);

		expect(mockServer.registerTool).toHaveBeenCalledWith(
			"web-search",
			expect.objectContaining({
				title: "Web Search",
				description: expect.stringContaining("Search the web"),
			}),
			expect.any(Function),
		);
	});

	test("should perform web search successfully", async () => {
		const mockServer = createMockServer();
		let toolHandler: any;

		mockServer.registerTool.mockImplementation(
			(_name: unknown, _config: unknown, handler: unknown) => {
				toolHandler = handler;
			},
		);

		registerWebSearchTool(mockServer as any);

		// Mock DuckDuckGo HTML response
		const mockHtml = `
            <article>
                <h2>
                    <a href="https://example.com/result1">
                        <span>First Result Title</span>
                    </a>
                </h2>
                <div>This is the first result snippet</div>
            </article>
            <article>
                <h2>
                    <a href="https://example.com/result2">
                        <span>Second Result Title</span>
                    </a>
                </h2>
                <div>This is the second result snippet</div>
            </article>
        `;

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			text: async () => mockHtml,
		} as Response);

		const result = await toolHandler({
			query: "test query",
			max_results: 5,
		});

		expect(result.content[0].text).toContain('Search results for: "test query"');
		expect(result.content[0].text).toContain("First Result Title");
		expect(result.content[0].text).toContain("https://example.com/result1");
		expect(result.content[0].text).toContain("This is the first result snippet");
	});

	test("should handle search errors gracefully", async () => {
		const mockServer = createMockServer();
		let toolHandler: any;

		mockServer.registerTool.mockImplementation(
			(_name: unknown, _config: unknown, handler: unknown) => {
				toolHandler = handler;
			},
		);

		registerWebSearchTool(mockServer as any);

		// Mock fetch error
		mockFetch.mockRejectedValueOnce(new Error("Network error"));

		const result = await toolHandler({
			query: "test query",
			max_results: 5,
		});

		expect(result.content[0].text).toContain("Error performing web search");
		expect(result.isError).toBe(true);
	});

	test("should return empty results for no matches", async () => {
		const mockServer = createMockServer();
		let toolHandler: any;

		mockServer.registerTool.mockImplementation(
			(_name: unknown, _config: unknown, handler: unknown) => {
				toolHandler = handler;
			},
		);

		registerWebSearchTool(mockServer as any);

		// Mock empty HTML response
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			text: async () => "<html><body>No results</body></html>",
		} as Response);

		const result = await toolHandler({
			query: "test query",
			max_results: 5,
		});

		expect(result.content[0].text).toContain("No results found");
	});

	test("should limit results to max_results", async () => {
		const mockServer = createMockServer();
		let toolHandler: any;

		mockServer.registerTool.mockImplementation(
			(_name: unknown, _config: unknown, handler: unknown) => {
				toolHandler = handler;
			},
		);

		registerWebSearchTool(mockServer as any);

		// Create HTML with multiple results
		const articles = Array.from(
			{ length: 15 },
			(_, i) => `
            <article>
                <h2>
                    <a href="https://example.com/result${i + 1}">
                        <span>Result ${i + 1} Title</span>
                    </a>
                </h2>
                <div>Snippet for result ${i + 1}</div>
            </article>
        `,
		).join("");

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			text: async () => articles,
		} as Response);

		const result = await toolHandler({
			query: "test query",
			max_results: 3,
		});

		// Count number of results in output
		const resultText = result.content[0].text;
		const resultCount = (resultText.match(/\d+\. /g) || []).length;
		expect(resultCount).toBe(3);
	});
});

describe("Web Fetch Tool Tests", () => {
	test("should register web fetch tool", () => {
		const mockServer = createMockServer();
		registerWebFetchTool(mockServer as any);

		expect(mockServer.registerTool).toHaveBeenCalledWith(
			"web-fetch",
			expect.objectContaining({
				title: "Web Fetch",
				description: expect.stringContaining("Fetch content from a URL"),
			}),
			expect.any(Function),
		);
	});

	test("should fetch HTML content from allowed domain", async () => {
		const mockServer = createMockServer();
		let toolHandler: any;

		mockServer.registerTool.mockImplementation(
			(_name: unknown, _config: unknown, handler: unknown) => {
				toolHandler = handler;
			},
		);

		registerWebFetchTool(mockServer as any);

		const mockHtml =
			"<html><body><h1>Test Page</h1><p>This is a test page content.</p></body></html>";

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Map([["content-type", "text/html"]]),
			text: async () => mockHtml,
		} as unknown as Response);

		const result = await toolHandler({
			url: "https://blog.duyet.net/test-page",
			allow_any_domain: false,
			include_headers: false,
		});

		expect(result.content[0].text).toContain("URL: https://blog.duyet.net/test-page");
		expect(result.content[0].text).toContain("Status: 200");
		expect(result.content[0].text).toContain("Test Page");
		expect(result.content[0].text).toContain("This is a test page content");
	});

	test("should fetch JSON content", async () => {
		const mockServer = createMockServer();
		let toolHandler: any;

		mockServer.registerTool.mockImplementation(
			(_name: unknown, _config: unknown, handler: unknown) => {
				toolHandler = handler;
			},
		);

		registerWebFetchTool(mockServer as any);

		const mockJson = { name: "Duyet", role: "Data Engineer" };

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Map([["content-type", "application/json"]]),
			json: async () => mockJson,
		} as unknown as Response);

		const result = await toolHandler({
			url: "https://duyet.net/api/data",
			allow_any_domain: false,
			include_headers: false,
		});

		expect(result.content[0].text).toContain('"name": "Duyet"');
		expect(result.content[0].text).toContain('"role": "Data Engineer"');
	});

	test("should reject non-allowed domain by default", async () => {
		const mockServer = createMockServer();
		let toolHandler: any;

		mockServer.registerTool.mockImplementation(
			(_name: unknown, _config: unknown, handler: unknown) => {
				toolHandler = handler;
			},
		);

		registerWebFetchTool(mockServer as any);

		const result = await toolHandler({
			url: "https://evil.com/malicious",
			allow_any_domain: false,
			include_headers: false,
		});

		expect(result.content[0].text).toContain("Error fetching URL");
		expect(result.content[0].text).toContain("URL not allowed");
		expect(result.isError).toBe(true);
	});

	test("should allow any domain when flag is set", async () => {
		const mockServer = createMockServer();
		let toolHandler: any;

		mockServer.registerTool.mockImplementation(
			(_name: unknown, _config: unknown, handler: unknown) => {
				toolHandler = handler;
			},
		);

		registerWebFetchTool(mockServer as any);

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Map([["content-type", "text/plain"]]),
			text: async () => "Plain text content",
		} as unknown as Response);

		const result = await toolHandler({
			url: "https://any-domain.com/page",
			allow_any_domain: true,
			include_headers: false,
		});

		expect(result.content[0].text).toContain("URL: https://any-domain.com/page");
		expect(result.content[0].text).toContain("Plain text content");
	});

	test("should include headers when requested", async () => {
		const mockServer = createMockServer();
		let toolHandler: any;

		mockServer.registerTool.mockImplementation(
			(_name: unknown, _config: unknown, handler: unknown) => {
				toolHandler = handler;
			},
		);

		registerWebFetchTool(mockServer as any);

		const mockHeaders = new Map([
			["content-type", "text/html"],
			["x-custom-header", "custom-value"],
		]);

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: {
				get: (key: string) => mockHeaders.get(key),
				forEach: (callback: (value: string, key: string) => void) => {
					mockHeaders.forEach((value, key) => {
						callback(value, key);
					});
				},
			},
			text: async () => "<html><body>Test</body></html>",
		} as unknown as Response);

		const result = await toolHandler({
			url: "https://duyet.net/page",
			allow_any_domain: false,
			include_headers: true,
		});

		expect(result.content[0].text).toContain("Headers:");
		expect(result.content[0].text).toContain("content-type");
		expect(result.content[0].text).toContain("x-custom-header");
	});

	test("should handle fetch errors gracefully", async () => {
		const mockServer = createMockServer();
		let toolHandler: any;

		mockServer.registerTool.mockImplementation(
			(_name: unknown, _config: unknown, handler: unknown) => {
				toolHandler = handler;
			},
		);

		registerWebFetchTool(mockServer as any);

		mockFetch.mockRejectedValueOnce(new Error("Network timeout"));

		const result = await toolHandler({
			url: "https://duyet.net/page",
			allow_any_domain: false,
			include_headers: false,
		});

		expect(result.content[0].text).toContain("Error fetching URL");
		expect(result.content[0].text).toContain("Network timeout");
		expect(result.isError).toBe(true);
	});

	test("should truncate large HTML content", async () => {
		const mockServer = createMockServer();
		let toolHandler: any;

		mockServer.registerTool.mockImplementation(
			(_name: unknown, _config: unknown, handler: unknown) => {
				toolHandler = handler;
			},
		);

		registerWebFetchTool(mockServer as any);

		// Create large HTML content (> 10000 chars)
		const largeContent = `<html><body>${"A".repeat(15000)}</body></html>`;

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Map([["content-type", "text/html"]]),
			text: async () => largeContent,
		} as unknown as Response);

		const result = await toolHandler({
			url: "https://duyet.net/large-page",
			allow_any_domain: false,
			include_headers: false,
		});

		expect(result.content[0].text).toContain("[Content truncated...]");
	});

	test("should reject invalid protocols", async () => {
		const mockServer = createMockServer();
		let toolHandler: any;

		mockServer.registerTool.mockImplementation(
			(_name: unknown, _config: unknown, handler: unknown) => {
				toolHandler = handler;
			},
		);

		registerWebFetchTool(mockServer as any);

		const result = await toolHandler({
			url: "ftp://duyet.net/file",
			allow_any_domain: true,
			include_headers: false,
		});

		expect(result.content[0].text).toContain("Error fetching URL");
		expect(result.content[0].text).toContain("Invalid URL protocol");
		expect(result.isError).toBe(true);
	});
});
