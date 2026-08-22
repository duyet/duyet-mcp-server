import { beforeEach, describe, expect, mock, it } from "bun:test";
import app from "../index";

describe("Well-known metadata", () => {
	let mockEnv: Env;
	let mockCtx: ExecutionContext;

	beforeEach(() => {
		mockEnv = {
			DB: {} as D1Database,
			MCP_OBJECT: {} as DurableObjectNamespace,
			ANALYTICS: {} as AnalyticsEngineDataset,
		} as unknown as Env;

		mockCtx = {
			waitUntil: mock(() => undefined),
			passThroughOnException: mock(() => undefined),
		} as unknown as ExecutionContext;
	});

	it("serves RFC 9728 protected-resource metadata", async () => {
		const request = new Request("http://localhost/.well-known/oauth-protected-resource");

		const response = await app.fetch(request, mockEnv, mockCtx);

		expect(response.status).toBe(200);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");

		const body = (await response.json()) as {
			resource: string;
			authorization_servers: string[];
			scopes_supported: string[];
			bearer_methods_supported: string[];
			resource_documentation: string;
		};
		expect(body.resource).toBe("https://mcp.duyet.net");
		expect(body.authorization_servers).toContain("https://duyet.net");
		expect(body.scopes_supported).toEqual(["read:profile", "chat"]);
		expect(body.bearer_methods_supported).toContain("header");
		expect(body.resource_documentation).toBe("https://duyet.net/developers");
	});

	it("mentions scopes and developer docs in llms.txt", async () => {
		const request = new Request("http://localhost/llms.txt");

		const response = await app.fetch(request, mockEnv, mockCtx);
		const text = await response.text();

		expect(response.status).toBe(200);
		expect(text).toContain("When to use");
		expect(text).toContain("read:profile");
		expect(text).toContain("/.well-known/oauth-protected-resource");
		expect(text).toContain("https://duyet.net/developers");
	});

	it("links agent metadata from the home page", async () => {
		const request = new Request("http://localhost/");

		const response = await app.fetch(request, mockEnv, mockCtx);
		const html = await response.text();

		expect(response.status).toBe(200);
		expect(html).toContain("/.well-known/oauth-protected-resource");
		expect(html).toContain("https://duyet.net/developers");
	});
});
