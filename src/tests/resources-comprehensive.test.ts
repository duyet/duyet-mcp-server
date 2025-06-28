import { registerCVResource } from "../resources/cv";
import { registerGitHubActivityResource } from "../resources/github-activity";
import { registerHireMeResource } from "../resources/hire-me";

// Mock fetch globally
global.fetch = jest.fn();

const mockServer = {
	handlers: new Map<string, any>(),
	registerResource: jest.fn(function (this: any, name: string, _template, _config, handler: any) {
		this.handlers.set(name, handler);
	}),
	getResourceHandler(name: string) {
		return this.handlers.get(name);
	},
};

registerCVResource(mockServer as any);
registerGitHubActivityResource(mockServer as any);
registerHireMeResource(mockServer as any);

describe("Resources Comprehensive Coverage Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(global.fetch as jest.Mock).mockImplementation((url: string | URL) => {
			const urlString = url.toString();
			if (urlString.endsWith("cv.json")) {
				return Promise.resolve({
					ok: true,
					text: () => Promise.resolve('{ "name": "Duyet Le" }'),
					json: () => Promise.resolve({ name: "Duyet Le" }),
				});
			}
			if (urlString.endsWith("/cv")) {
				return Promise.resolve({
					ok: true,
					text: () =>
						Promise.resolve(
							"<html><head><title>Mocked CV Title</title></head><body>CV content</body></html>",
						),
				});
			}
			// Default mock for github
			return Promise.resolve({
				ok: true,
				status: 200,
				json: async () => [
					{
						type: "PushEvent",
						created_at: "2024-01-01T00:00:00Z",
						repo: { name: "duyet/test-repo" },
						payload: { commits: [{ message: "Test commit" }] },
					},
				],
			});
		});
	});

	describe("CV Resource Complete Coverage", () => {
		let resourceHandler: any;
		beforeAll(() => {
			resourceHandler = mockServer.getResourceHandler("cv");
		});

		test("should handle CV resource with JSON format success path", async () => {
			const mockUri = new URL("duyet://cv/json");
			const result = await resourceHandler(mockUri, { format: "json" });

			expect(result.contents[0].text).toContain("CV Data (JSON format):");
			expect(result.contents[0].text).toContain("Duyet Le");
			expect(result.contents[0].mimeType).toBe("application/json");
		});

		test("should handle CV resource JSON fetch error with fallback", async () => {
			(global.fetch as jest.Mock).mockImplementation((url: string) => {
				if (url.includes("cv.json")) {
					return Promise.reject(new Error("JSON fetch error"));
				}
				return Promise.resolve({
					ok: true,
					text: async () =>
						"<title>Duyet - Senior Data Engineer</title><body>CV content</body>",
				});
			});

			const mockUri = new URL("duyet://cv/json");
			const result = await resourceHandler(mockUri, { format: "json" });

			// Should fallback to summary format
			expect(result.contents[0].text).toContain("Duyet - Senior Data Engineer");
			expect(result.contents[0].text).toContain("Sr. Data Engineer with");
		});
	});

	describe("GitHub Activity Resource Complete Coverage", () => {
		let resourceHandler: any;
		beforeAll(() => {
			resourceHandler = mockServer.getResourceHandler("github-activity");
		});

		test("should handle GitHub activity with empty response", async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => [],
			});

			const mockUri = new URL("duyet://github/activity/5");
			const result = await resourceHandler(mockUri, { limit: "5" });

			expect(result.contents[0].text).toContain("No recent GitHub activity");
		});

		test("should handle GitHub activity limit parameter bounds", async () => {
			const mockUri = new URL("duyet://github/activity/0");
			const resultInvalid = await resourceHandler(mockUri, { limit: "0" });
			expect(resultInvalid.contents[0].text).toContain("Recent GitHub Activity");
		});

		test("should handle github-activity with network error", async () => {
			(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

			const mockUri = new URL("duyet://github/activity/5");
			const result = await resourceHandler(mockUri, { limit: "5" });

			expect(result.contents[0].text).toContain("Error fetching GitHub activity");
		});
	});

	describe("Hire Me Resource Complete Coverage", () => {
		let resourceHandler: any;
		beforeAll(() => {
			resourceHandler = mockServer.getResourceHandler("hire-me");
		});

		test("should handle Hire Me resource with tech stack", async () => {
			const mockUri = new URL("duyet://hire-me/full_time");
			const result = await resourceHandler(mockUri, {
				role_type: "full_time",
				tech_stack: "Go, Python, and TypeScript",
			});

			expect(result.contents[0].text).toContain(
				"Tech match: Your stack includes python, typescript",
			);
		});

		test("should handle Hire Me resource with company size", async () => {
			const mockUri = new URL("duyet://hire-me/full_time");
			const result = await resourceHandler(mockUri, {
				role_type: "full_time",
				company_size: "startup",
			});

			expect(result.contents[0].text).toContain(
				"Perfect! I enjoy the fast-paced environment",
			);
		});

		test("should handle Hire Me resource with no parameters", async () => {
			const mockUri = new URL("duyet://hire-me/general");
			const result = await resourceHandler(mockUri, {});

			expect(result.contents[0].text).toContain("Hire Duyet");
		});
	});
});
