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

jest.mock("../resources/github-activity", () => ({
	registerGitHubActivityResource: jest.fn(),
}));

jest.mock("../tools/get-cv", () => ({
	registerGetCVTool: jest.fn(),
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
	registerContactAnalyticsTool: jest.fn(),
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
			const {
				registerGitHubActivityResource,
			} = require("../resources/github-activity");

			registerAllResources(mockServer, mockEnv);

			expect(registerAboutDuyetResource).toHaveBeenCalledWith(mockServer);
			expect(registerCVResource).toHaveBeenCalledWith(mockServer);
			expect(registerBlogPostsResource).toHaveBeenCalledWith(mockServer);
			expect(registerGitHubActivityResource).toHaveBeenCalledWith(mockServer);
		});
	});

	describe("Tools Index", () => {
		test("should call registerAllTools and invoke all tool registrations", () => {
			const {
				registerGetCVTool,
			} = require("../tools/get-cv");
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
				registerContactAnalyticsTool,
			} = require("../tools/contact-analytics");

			registerAllTools(mockServer, mockEnv);

			expect(registerGetCVTool).toHaveBeenCalledWith(mockServer);
			expect(registerHireMeTool).toHaveBeenCalledWith(mockServer);
			expect(registerSayHiTool).toHaveBeenCalledWith(mockServer);
			expect(registerSendMessageTool).toHaveBeenCalledWith(mockServer, mockEnv);
			expect(registerContactAnalyticsTool).toHaveBeenCalledWith(mockServer, mockEnv);
		});
	});
});