/**
 * llms.txt fetching and parsing
 * Supports the llms.txt specification for AI-friendly website discovery
 */

import { cachedFetch } from "./cache.js";

export interface LLMsTxtData {
	raw: string;
	title?: string;
	summary?: string;
	sections: string[];
}

/**
 * Fetch and parse llms.txt from a domain
 */
export async function fetchLLMsTxt(domain: string): Promise<LLMsTxtData> {
	const url = `https://${domain}/llms.txt`;

	// Cache for 1 hour (3600000ms)
	const raw = await cachedFetch(url, async (response) => response.text(), 3600000);

	return parseLLMsTxt(raw);
}

/**
 * Parse llms.txt content according to specification
 */
export function parseLLMsTxt(content: string): LLMsTxtData {
	const lines = content.split("\n");
	let title: string | undefined;
	let summary: string | undefined;
	const sections: string[] = [];
	let currentSection: string[] = [];
	let inBlockquote = false;

	for (const line of lines) {
		const trimmed = line.trim();

		// Parse H1 title (first one only)
		if (!title && trimmed.startsWith("# ")) {
			title = trimmed.substring(2).trim();
			continue;
		}

		// Parse blockquote summary
		if (trimmed.startsWith(">")) {
			inBlockquote = true;
			const quoteContent = trimmed.substring(1).trim();
			summary = summary ? `${summary} ${quoteContent}` : quoteContent;
			continue;
		}

		// End of blockquote
		if (inBlockquote && !trimmed.startsWith(">")) {
			inBlockquote = false;
		}

		// Collect sections (everything after title and summary)
		if (title && !inBlockquote) {
			if (trimmed.startsWith("##")) {
				// New section starts
				if (currentSection.length > 0) {
					sections.push(currentSection.join("\n").trim());
					currentSection = [];
				}
			}
			currentSection.push(line);
		}
	}

	// Add last section
	if (currentSection.length > 0) {
		sections.push(currentSection.join("\n").trim());
	}

	return {
		raw: content,
		title,
		summary,
		sections,
	};
}

/**
 * Get llms.txt for Duyet's blog
 */
export async function getDuyetLLMsTxt(): Promise<LLMsTxtData> {
	try {
		return await fetchLLMsTxt("blog.duyet.net");
	} catch (error) {
		// Fallback to default content if fetch fails
		const fallback = `# Duyet - Senior Data Engineer

> Duyet is a Senior Data Engineer with extensive experience in data engineering, cloud technologies, and distributed systems. Specializes in building scalable data platforms and infrastructure.

## About

Duyet (Van-Duyet Le) is a Senior Data Engineer based in Vietnam. He specializes in:
- Data engineering and platform architecture
- Cloud technologies (AWS, GCP, Azure)
- Distributed systems and big data processing
- Open source contributions

## Resources

- Personal website: https://duyet.net
- Blog: https://blog.duyet.net
- GitHub: https://github.com/duyet
- LinkedIn: https://linkedin.com/in/duyet

## Contact

- Email: me@duyet.net
- Open to remote opportunities worldwide
`;
		return parseLLMsTxt(fallback);
	}
}
