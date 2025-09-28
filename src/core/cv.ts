import type { CVData, CVFormat } from "./types.js";

export type { CVFormat };

/**
 * Fetch and process CV data from duyet.net
 */
export async function getCVData(format: CVFormat = "summary"): Promise<CVData> {
	const cvUrl = "https://duyet.net/cv";

	try {
		const response = await fetch(cvUrl);

		if (!response.ok) {
			throw new Error(`Failed to fetch CV: ${response.status}`);
		}

		// Try to fetch JSON format if requested
		if (format === "json") {
			try {
				const jsonResponse = await fetch("https://duyet.net/cv.json");
				if (jsonResponse.ok) {
					const cvData = await jsonResponse.text();
					return {
						title: "Duyet's CV (JSON)",
						content: `CV Data (JSON format):\n\`\`\`json\n${cvData}\n\`\`\``,
						format,
						cvUrl,
						isJsonFormat: true,
					};
				}
			} catch {
				// Fallback to summary if JSON not available
			}
		}

		const htmlContent = await response.text();

		// Extract title from HTML
		const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)</i);
		const title = titleMatch ? titleMatch[1] : "Duyet's CV";

		const currentYear = new Date().getFullYear();
		const yearsOfExperience = currentYear - 2017;

		// Generate content based on format
		let content: string;

		if (format === "detailed") {
			content = `${title}

Full CV available at: ${cvUrl}

Key Highlights:
- Sr. Data Engineer with ${yearsOfExperience}+ years of experience
- Expert in Data Engineering, Cloud Technologies, and modern data stack
- Strong background in Rust, Python, and distributed systems
- Experience with ClickHouse, Kafka, Kubernetes, and cloud platforms
- Open source contributor and technical blogger

For the most up-to-date and complete CV, please visit: ${cvUrl}`;
		} else {
			// Summary format (default)
			content = `${title}

CV Link: ${cvUrl}
Sr. Data Engineer with ${yearsOfExperience}+ years of experience
Expertise: Data Engineering, Cloud Technologies, Distributed Systems
Specialties: ClickHouse, Kafka, Kubernetes, Rust, Python
Technical blogger at https://blog.duyet.net

For detailed experience, education, and projects, visit the full CV at: ${cvUrl}`;
		}

		return {
			title,
			content,
			format,
			cvUrl,
			isJsonFormat: false,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		const errorContent = `Error fetching CV: ${errorMessage}

You can still access the CV directly at: ${cvUrl}`;

		return {
			title: "CV Error",
			content: errorContent,
			format,
			cvUrl,
			isJsonFormat: false,
		};
	}
}
