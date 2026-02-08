import { describe, expect, test, beforeEach, mock, type Mock } from "bun:test";
import { registerAllResources } from "../resources/index";
import { registerAllTools } from "../tools/index";

// Mock fetch globally
const mockFetch = mock(() => Promise.resolve({} as Response));
globalThis.fetch = mockFetch as unknown as typeof fetch;

const createMockServer = () =>
	({
		registerResource: mock(() => undefined),
		registerTool: mock(() => undefined),
	}) as unknown as {
		registerResource: Mock<(...args: unknown[]) => unknown>;
		registerTool: Mock<(...args: unknown[]) => unknown>;
	};

const mockEnv = {
	DB: {} as D1Database,
} as Env;

describe("Index Functions Coverage", () => {
	let mockServer: ReturnType<typeof createMockServer>;

	beforeEach(() => {
		mockServer = createMockServer();
		mockFetch.mockClear();
		mockFetch.mockResolvedValue({
			ok: true,
			status: 200,
			text: async () => "<title>Test</title>",
			json: async () => [],
		} as Response);
	});

	describe("Resources Index", () => {
		test("should call registerAllResources and invoke all resource registrations", () => {
			registerAllResources(mockServer as any, mockEnv);
			// Should register 5 resources: about-duyet, cv, blog-posts, github-activity, llms-txt
			expect(mockServer.registerResource).toHaveBeenCalledTimes(5);
		});
	});

	describe("Tools Index", () => {
		test("should call registerAllTools and invoke all tool registrations", () => {
			registerAllTools(mockServer as any, mockEnv);
			// Should register 6 tools: github_activity, get_blog_post_content, send_message, hire_me, say_hi, get_analytics
			expect(mockServer.registerTool).toHaveBeenCalledTimes(6);
		});
	});
});
