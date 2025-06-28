import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Register the about-duyet resource
 */
export function registerAboutDuyetResource(server: McpServer) {
	server.registerResource(
		"about-duyet",
		"duyet://about",
		{
			title: "About Duyet",
			description:
				"Basic information about Duyet, a Senior Data Engineer with extensive experience in data engineering, cloud technologies, and distributed systems",
			mimeType: "text/plain",
		},
		async (uri: URL) => {
			const yearsOfExperience = calculateYearsOfExperience();
			const content = getAboutDuyetContent(yearsOfExperience);

			return {
				contents: [
					{
						uri: uri.href,
						text: content.trim(),
					},
				],
			};
		},
	);
}

/**
 * Calculate years of experience since 2017
 */
export function calculateYearsOfExperience(): number {
	const currentYear = new Date().getFullYear();
	return currentYear - 2017;
}

/**
 * Generate about Duyet content with years of experience
 */
export function getAboutDuyetContent(yearsOfExperience: number): string {
	return `
              I'm Duyet, Data Engineer with ${yearsOfExperience} years of experience.
              
              I am confident in my knowledge of Data Engineering concepts,
              best practices and state-of-the-art data and Cloud technologies.
              
              Check out my blog at https://blog.duyet.net, my cv at https://duyet.net/cv,
              and my projects at https://github.com/duyet`;
}