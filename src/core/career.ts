/**
 * Career preferences and HR-related data
 * This module provides information useful for recruiters and HR professionals
 */

export interface CareerPreferences {
	workArrangement: {
		remoteOnly: boolean;
		willingToRelocate: boolean;
		preferredLocations: string[];
	};
	compensation: {
		currency: string;
		minAnnual: number;
		maxAnnual: number;
		flexible: boolean;
		notes: string;
	};
	availability: {
		noticePeriod: string;
		availableFrom: string;
		status: "actively_looking" | "open_to_opportunities" | "not_looking";
	};
	preferences: {
		companySize: string[];
		industries: string[];
		technologies: string[];
		teamSize: string;
		workStyle: string[];
	};
	dealBreakers: string[];
	mustHaves: string[];
}

/**
 * Get Duyet's career preferences and requirements
 */
export function getCareerPreferences(): CareerPreferences {
	return {
		workArrangement: {
			remoteOnly: true,
			willingToRelocate: false,
			preferredLocations: ["Vietnam (remote)", "Asia Pacific (remote)", "Global (remote)"],
		},
		compensation: {
			currency: "USD",
			minAnnual: 80000,
			maxAnnual: 150000,
			flexible: true,
			notes: "Open to discussion based on role complexity, equity, and benefits package",
		},
		availability: {
			noticePeriod: "1 month",
			availableFrom: "2025-11-01",
			status: "open_to_opportunities",
		},
		preferences: {
			companySize: ["startup", "scale-up", "enterprise"],
			industries: [
				"Data Infrastructure",
				"Cloud Computing",
				"DevOps/Platform Engineering",
				"Open Source",
				"SaaS",
				"Fintech",
			],
			technologies: [
				"Python",
				"Go",
				"Rust",
				"Kubernetes",
				"Cloud platforms (AWS/GCP/Azure)",
				"Data processing (Spark, Flink, Kafka)",
				"Infrastructure as Code",
			],
			teamSize: "5-20 people preferred",
			workStyle: ["Async-first", "Documentation-driven", "Open source friendly"],
		},
		dealBreakers: [
			"Must be on-site full-time",
			"No remote work options",
			"Micromanagement culture",
			"No work-life balance",
			"Outdated technology stack with no modernization plans",
		],
		mustHaves: [
			"100% remote work",
			"Flexible working hours",
			"Strong engineering culture",
			"Investment in professional development",
			"Modern tech stack",
			"Clear growth path",
		],
	};
}

/**
 * Format career preferences for MCP response
 */
export function formatCareerPreferences(prefs: CareerPreferences): string {
	return `# Career Preferences & Requirements

## Work Arrangement
- **Remote Only**: ${prefs.workArrangement.remoteOnly ? "Yes - 100% remote required" : "Flexible"}
- **Willing to Relocate**: ${prefs.workArrangement.willingToRelocate ? "Yes" : "No"}
- **Preferred Locations**: ${prefs.workArrangement.preferredLocations.join(", ")}

## Compensation Expectations
- **Salary Range**: ${prefs.compensation.currency} $${prefs.compensation.minAnnual.toLocaleString()} - $${prefs.compensation.maxAnnual.toLocaleString()} annually
- **Flexible**: ${prefs.compensation.flexible ? "Yes" : "No"}
- **Notes**: ${prefs.compensation.notes}

## Availability
- **Current Status**: ${prefs.availability.status.replace(/_/g, " ").toUpperCase()}
- **Notice Period**: ${prefs.availability.noticePeriod}
- **Available From**: ${prefs.availability.availableFrom}

## Preferences

### Company Size
${prefs.preferences.companySize.map((size) => `- ${size}`).join("\n")}

### Industries of Interest
${prefs.preferences.industries.map((industry) => `- ${industry}`).join("\n")}

### Technology Preferences
${prefs.preferences.technologies.map((tech) => `- ${tech}`).join("\n")}

### Team & Work Style
- **Team Size**: ${prefs.preferences.teamSize}
- **Work Style**: ${prefs.preferences.workStyle.join(", ")}

## Deal Breakers (Must Avoid)
${prefs.dealBreakers.map((item) => `- ❌ ${item}`).join("\n")}

## Must-Haves (Non-Negotiable)
${prefs.mustHaves.map((item) => `- ✅ ${item}`).join("\n")}

---

**Note for Recruiters**: Please ensure your opportunity meets the must-haves and avoids the deal breakers before reaching out. This helps us both save time and ensures a good fit.
`;
}

/**
 * Answer common HR questions
 */
export function answerHRQuestion(question: string): string {
	const q = question.toLowerCase().trim();

	// Expected salary
	if (
		q.includes("salary") ||
		q.includes("compensation") ||
		q.includes("expected") ||
		q.includes("pay")
	) {
		const prefs = getCareerPreferences();
		return `Expected salary range: ${prefs.compensation.currency} $${prefs.compensation.minAnnual.toLocaleString()} - $${prefs.compensation.maxAnnual.toLocaleString()} annually.

${prefs.compensation.notes}

Note: This is flexible based on the role's complexity, equity compensation, benefits package, and overall opportunity.`;
	}

	// Remote work
	if (q.includes("remote") || q.includes("office") || q.includes("location")) {
		return `100% remote work is required. I am not open to hybrid or on-site positions.

I'm based in Vietnam but can work across any timezone with overlap. Preferred locations: Vietnam (remote), Asia Pacific (remote), or Global (remote) with flexible hours.`;
	}

	// Availability
	if (
		q.includes("available") ||
		q.includes("start") ||
		q.includes("notice") ||
		q.includes("when")
	) {
		const prefs = getCareerPreferences();
		return `Current status: ${prefs.availability.status.replace(/_/g, " ")}
Notice period: ${prefs.availability.noticePeriod}
Available from: ${prefs.availability.availableFrom}

I'm currently open to opportunities and can discuss timeline flexibility based on the right opportunity.`;
	}

	// Visa/work authorization
	if (q.includes("visa") || q.includes("authorization") || q.includes("sponsorship")) {
		return `I'm based in Vietnam and have full work authorization for remote work from Vietnam.

For other locations, I would need visa sponsorship, but I strongly prefer 100% remote positions where physical relocation is not required.`;
	}

	// Technologies/skills
	if (
		q.includes("skill") ||
		q.includes("technology") ||
		q.includes("stack") ||
		q.includes("experience")
	) {
		return `Primary expertise:
- Languages: Python, Go, Rust, TypeScript
- Data Engineering: Spark, Flink, Kafka, Airflow
- Cloud: AWS, GCP, Azure (multi-cloud experience)
- Infrastructure: Kubernetes, Docker, Terraform, IaC
- Databases: PostgreSQL, MongoDB, Redis, ClickHouse

See my full CV for detailed experience: https://duyet.net/cv or use the get-cv tool.`;
	}

	// Generic fallback
	return `I don't have a specific answer for that question. Here are some quick facts:

- 100% remote only
- Expected salary: USD $80,000 - $150,000 (flexible)
- Available from: 2025-11-01
- Notice period: 1 month
- Status: Open to opportunities

For more details, please:
1. Use the 'get_career_preferences' tool for comprehensive information
2. View my CV: https://duyet.net/cv or use 'get-cv' tool
3. Send a message via 'send-message' tool for specific questions`;
}
