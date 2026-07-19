import type { AboutDuyetData } from "./types.js";

/**
 * Calculate years of experience since 2017
 */
export function calculateYearsOfExperience(): number {
	const currentYear = new Date().getFullYear();
	return currentYear - 2017;
}

/**
 * Get comprehensive about Duyet data
 */
export function getAboutDuyetData(): AboutDuyetData {
	const yearsOfExperience = calculateYearsOfExperience();
	const content = `I'm Duyet, Sr. Data Engineer with ${yearsOfExperience} years of experience.

I am confident in my knowledge of Data Engineering concepts,
best practices and state-of-the-art data and Cloud technologies.

## Skills

- Data Engineering: Apache Spark, Kafka, Airflow, ClickHouse, DuckDB, modern data stack
- Cloud & Infrastructure: AWS, GCP, Azure, Kubernetes, Cloudflare Workers
- Programming: Rust, Python, TypeScript/JavaScript, SQL
- AI/ML: building AI agents, MCP servers, LLM-powered data tooling

## Open to Work

Open to opportunities in Data Engineering and building AI agents —
full-time, contract, or consulting. Use the \`hire_me\` or \`send_message\` tools to get in touch.

## Writing

296+ technical articles at https://blog.duyet.net covering data engineering,
cloud, Rust, and AI. Index for LLMs: https://blog.duyet.net/llms.txt

## Links

- Website: https://duyet.net · CV: https://duyet.net/cv
- Blog: https://blog.duyet.net
- GitHub: https://github.com/duyet
- X/Twitter: https://x.com/_duyet
- LinkedIn: https://linkedin.com/in/duyet
- Email: me@duyet.net`;

	return {
		content: content.trim(),
		yearsOfExperience,
		profileUrl: "https://duyet.net",
		blogUrl: "https://blog.duyet.net",
		githubUrl: "https://github.com/duyet",
		cvUrl: "https://duyet.net/cv",
	};
}
