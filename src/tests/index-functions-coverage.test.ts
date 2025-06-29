// Mock Octokit for GitHub Activity tool
const mockListPublicEventsForUser = jest.fn();
jest.mock("@octokit/rest", () => ({
	Octokit: jest.fn().mockImplementation(() => ({
		rest: {
			activity: {
				listPublicEventsForUser: mockListPublicEventsForUser,
			},
		},
	})),
}));

import { registerAllResources } from "../resources/index";
import { registerAllTools } from "../tools/index";

// Mock all individual registration functions
jest.mock("../resources/about-duyet", () => ({
	registerAboutDuyetResource: jest.fn(),
}));

jest.mock("../resources/cv", () => ({
	registerCVResource: jest.fn(),
}));

jest.mock("../resources/blog-posts", () => ({
	registerBlogPostsResource: jest.fn(),
}));


jest.mock("../tools/get-cv", () => ({
	registerGetCVTool: jest.fn(),
}));

jest.mock("../tools/github-activity", () => ({
	registerGitHubActivityTool: jest.fn(),
}));

jest.mock("../tools/hire-me", () => ({
	registerHireMeTool: jest.fn(),
}));

jest.mock("../tools/say-hi", () => ({
	registerSayHiTool: jest.fn(),
}));

jest.mock("../tools/send-message", () => ({
	registerSendMessageTool: jest.fn(),
}));

jest.mock("../tools/contact-analytics", () => ({
	registerGetAnalyticsTool: jest.fn(),
}));

const mockServer = {
	registerResource: jest.fn(),
	registerTool: jest.fn(),
} as any;

const mockEnv = {
	DB: {} as D1Database,
} as Env;

describe("Index Functions Coverage", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("Resources Index", () => {
		test("should call registerAllResources and invoke all resource registrations", () => {
			const {
				registerAboutDuyetResource,
			} = require("../resources/about-duyet");
			const {
				registerCVResource,
			} = require("../resources/cv");
			const {
				registerBlogPostsResource,
			} = require("../resources/blog-posts");

			registerAllResources(mockServer, mockEnv);

			expect(registerAboutDuyetResource).toHaveBeenCalledWith(mockServer);
			expect(registerCVResource).toHaveBeenCalledWith(mockServer);
			expect(registerBlogPostsResource).toHaveBeenCalledWith(mockServer);
			// GitHub activity is now a tool, not a resource
		});
	});

	describe("Tools Index", () => {
		test("should call registerAllTools and invoke all tool registrations", () => {
			const {
				registerGetCVTool,
			} = require("../tools/get-cv");
			const {
				registerGitHubActivityTool,
			} = require("../tools/github-activity");
			const {
				registerHireMeTool,
			} = require("../tools/hire-me");
			const {
				registerSayHiTool,
			} = require("../tools/say-hi");
			const {
				registerSendMessageTool,
			} = require("../tools/send-message");
			const {
				registerGetAnalyticsTool,
			} = require("../tools/contact-analytics");

			registerAllTools(mockServer, mockEnv);

			expect(registerGetCVTool).toHaveBeenCalledWith(mockServer);
			expect(registerGitHubActivityTool).toHaveBeenCalledWith(mockServer);
			expect(registerHireMeTool).toHaveBeenCalledWith(mockServer, mockEnv);
			expect(registerSayHiTool).toHaveBeenCalledWith(mockServer);
			expect(registerSendMessageTool).toHaveBeenCalledWith(mockServer, mockEnv);
			expect(registerGetAnalyticsTool).toHaveBeenCalledWith(mockServer, mockEnv);
		});
	});
});