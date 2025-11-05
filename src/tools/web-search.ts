import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Web Search Tool
 *
 * Provides web search functionality using DuckDuckGo's HTML interface.
 * Returns search results with titles, URLs, and snippets.
 */

interface SearchResult {
    title: string;
    url: string;
    snippet: string;
}

/**
 * Parse DuckDuckGo HTML search results
 */
function parseDuckDuckGoResults(html: string): SearchResult[] {
    const results: SearchResult[] = [];

    // Basic HTML parsing for DuckDuckGo results
    // Pattern matches result divs in DDG HTML
    const resultPattern = /<article[^>]*>[\s\S]*?<h2[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<span[^>]*>(.*?)<\/span>[\s\S]*?<\/a>[\s\S]*?<\/h2>[\s\S]*?<div[^>]*>(.*?)<\/div>[\s\S]*?<\/article>/gi;

    let match: RegExpExecArray | null = null;
    match = resultPattern.exec(html);
    while (match !== null && results.length < 10) {
        const url = match[1];
        const title = match[2].replace(/<[^>]*>/g, "").trim();
        const snippet = match[3].replace(/<[^>]*>/g, "").trim();

        if (url && title && snippet) {
            results.push({ url, title, snippet });
        }

        match = resultPattern.exec(html);
    }

    return results;
}

/**
 * Perform web search using DuckDuckGo
 */
async function performWebSearch(query: string, maxResults = 5): Promise<SearchResult[]> {
    try {
        // Use DuckDuckGo HTML endpoint
        const searchUrl = new URL("https://html.duckduckgo.com/html/");
        searchUrl.searchParams.append("q", query);
        searchUrl.searchParams.append("kl", "us-en");

        const response = await fetch(searchUrl.toString(), {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; DuyetMCP/0.1; +https://duyet.net/)",
            },
        });

        if (!response.ok) {
            throw new Error(`Search request failed with status: ${response.status}`);
        }

        const html = await response.text();
        const results = parseDuckDuckGoResults(html);

        return results.slice(0, maxResults);
    } catch (error) {
        console.error("Web search error:", error);
        throw new Error("Failed to perform web search");
    }
}

/**
 * Format search results as text
 */
function formatSearchResults(query: string, results: SearchResult[]): string {
    if (results.length === 0) {
        return `No results found for: "${query}"`;
    }

    let output = `Search results for: "${query}"\n\n`;

    results.forEach((result, index) => {
        output += `${index + 1}. ${result.title}\n`;
        output += `   URL: ${result.url}\n`;
        output += `   ${result.snippet}\n\n`;
    });

    return output;
}

/**
 * Register web search tool
 */
export function registerWebSearchTool(server: McpServer) {
    server.registerTool(
        "web-search",
        {
            title: "Web Search",
            description:
                "Search the web for information using DuckDuckGo. Returns titles, URLs, and snippets of search results. Useful for finding current information, articles, documentation, and general web content.",
            inputSchema: {
                query: z
                    .string()
                    .min(1)
                    .describe("The search query to look up on the web"),
                max_results: z
                    .number()
                    .int()
                    .min(1)
                    .max(10)
                    .optional()
                    .describe("Maximum number of results to return (1-10, default: 5)"),
            },
        },
        async ({ query, max_results = 5 }) => {
            try {
                const results = await performWebSearch(query, max_results);
                const formattedResults = formatSearchResults(query, results);

                return {
                    content: [
                        {
                            type: "text" as const,
                            text: formattedResults,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error performing web search: ${error instanceof Error ? error.message : "Unknown error"}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
