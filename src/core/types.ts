/**
 * Shared TypeScript interfaces for core business logic
 */

// About Duyet data
export interface AboutDuyetData {
	content: string;
	yearsOfExperience: number;
	profileUrl: string;
	blogUrl: string;
	githubUrl: string;
	cvUrl: string;
}

// CV data formats
export type CVFormat = "summary" | "detailed" | "json";

export interface CVData {
	title: string;
	content: string;
	format: CVFormat;
	cvUrl: string;
	isJsonFormat?: boolean;
}

// Blog post data
export interface BlogPostData {
	title: string | null;
	link: string | null;
	description: string | null;
	pubDate: string | null;
}

export interface BlogPostsData {
	posts: BlogPostData[];
	totalFound: number;
	retrieved: number;
	feedUrl: string;
}

// GitHub activity data
export interface GitHubActivityItem {
	type: string;
	action: string;
	repository: string;
	date: string;
	details?: string;
}

export interface GitHubActivityData {
	activities: GitHubActivityItem[];
	totalRetrieved: number;
	profileUrl: string;
	username: string;
}

// Common error type
export interface CoreError {
	message: string;
	source: string;
	fallbackUrl?: string;
}