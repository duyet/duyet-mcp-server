/**
 * Tests for web search and web fetch tools
 */

import { registerWebSearchTool } from "../tools/web-search";
import { registerWebFetchTool } from "../tools/web-fetch";

// Mock fetch
global.fetch = jest.fn();

// Mock MCP server
const createMockServer = () =>
    ({
        registerTool: jest.fn(),
    }) as any;

beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
});

describe("Web Search Tool Tests", () => {
    test("should register web search tool", () => {
        const mockServer = createMockServer();
        registerWebSearchTool(mockServer);

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
            (_name: string, _config: any, handler: any) => {
                toolHandler = handler;
            },
        );

        registerWebSearchTool(mockServer);

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

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: async () => mockHtml,
        });

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
            (_name: string, _config: any, handler: any) => {
                toolHandler = handler;
            },
        );

        registerWebSearchTool(mockServer);

        // Mock fetch error
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

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
            (_name: string, _config: any, handler: any) => {
                toolHandler = handler;
            },
        );

        registerWebSearchTool(mockServer);

        // Mock empty HTML response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: async () => "<html><body>No results</body></html>",
        });

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
            (_name: string, _config: any, handler: any) => {
                toolHandler = handler;
            },
        );

        registerWebSearchTool(mockServer);

        // Create HTML with multiple results
        const articles = Array.from({ length: 15 }, (_, i) => `
            <article>
                <h2>
                    <a href="https://example.com/result${i + 1}">
                        <span>Result ${i + 1} Title</span>
                    </a>
                </h2>
                <div>Snippet for result ${i + 1}</div>
            </article>
        `).join("");

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: async () => articles,
        });

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
        registerWebFetchTool(mockServer);

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
            (_name: string, _config: any, handler: any) => {
                toolHandler = handler;
            },
        );

        registerWebFetchTool(mockServer);

        const mockHtml =
            "<html><body><h1>Test Page</h1><p>This is a test page content.</p></body></html>";

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: new Map([["content-type", "text/html"]]),
            text: async () => mockHtml,
        });

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
            (_name: string, _config: any, handler: any) => {
                toolHandler = handler;
            },
        );

        registerWebFetchTool(mockServer);

        const mockJson = { name: "Duyet", role: "Data Engineer" };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: new Map([["content-type", "application/json"]]),
            json: async () => mockJson,
        });

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
            (_name: string, _config: any, handler: any) => {
                toolHandler = handler;
            },
        );

        registerWebFetchTool(mockServer);

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
            (_name: string, _config: any, handler: any) => {
                toolHandler = handler;
            },
        );

        registerWebFetchTool(mockServer);

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: new Map([["content-type", "text/plain"]]),
            text: async () => "Plain text content",
        });

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
            (_name: string, _config: any, handler: any) => {
                toolHandler = handler;
            },
        );

        registerWebFetchTool(mockServer);

        const mockHeaders = new Map([
            ["content-type", "text/html"],
            ["x-custom-header", "custom-value"],
        ]);

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: {
                get: (key: string) => mockHeaders.get(key),
                forEach: (callback: (value: string, key: string) => void) => {
                    mockHeaders.forEach((value, key) => callback(value, key));
                },
            },
            text: async () => "<html><body>Test</body></html>",
        });

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
            (_name: string, _config: any, handler: any) => {
                toolHandler = handler;
            },
        );

        registerWebFetchTool(mockServer);

        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network timeout"));

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
            (_name: string, _config: any, handler: any) => {
                toolHandler = handler;
            },
        );

        registerWebFetchTool(mockServer);

        // Create large HTML content (> 10000 chars)
        const largeContent = "<html><body>" + "A".repeat(15000) + "</body></html>";

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: new Map([["content-type", "text/html"]]),
            text: async () => largeContent,
        });

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
            (_name: string, _config: any, handler: any) => {
                toolHandler = handler;
            },
        );

        registerWebFetchTool(mockServer);

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
