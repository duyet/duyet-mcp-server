import { afterEach, describe, expect, it } from "bun:test";
import { insertQuietly, insertRows, isClickHouseConfigured, query } from "../clickhouse/client";
import { fetchUsageData, safeTableName } from "../clickhouse/usage-queries";

const originalFetch = globalThis.fetch;

afterEach(() => {
	globalThis.fetch = originalFetch;
});

function env(overrides: Partial<Env> = {}): Env {
	return {
		CLICKHOUSE_URL: "https://clickhouse.example.net",
		CLICKHOUSE_DATABASE: "mcp",
		CLICKHOUSE_TABLE: "mcp_requests",
		CLICKHOUSE_USER: "writer",
		CLICKHOUSE_PASSWORD: "secret",
		CF_ACCESS_CLIENT_ID: "client-id",
		CF_ACCESS_CLIENT_SECRET: "client-secret",
		...overrides,
	} as unknown as Env;
}

interface Captured {
	url: string;
	headers: Record<string, string>;
	body: string;
}

/** Replace fetch and record what the client sent. */
function captureFetch(response: Response): Captured[] {
	const calls: Captured[] = [];
	globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
		calls.push({
			url: String(input),
			headers: (init?.headers ?? {}) as Record<string, string>,
			body: String(init?.body ?? ""),
		});
		return response.clone();
	}) as typeof fetch;
	return calls;
}

describe("isClickHouseConfigured", () => {
	it("requires url, user, password and Access secrets", () => {
		expect(isClickHouseConfigured(env())).toBe(true);
		expect(isClickHouseConfigured(env({ CLICKHOUSE_URL: "" } as Partial<Env>))).toBe(false);
		expect(isClickHouseConfigured(env({ CLICKHOUSE_PASSWORD: "" } as Partial<Env>))).toBe(
			false,
		);
		expect(isClickHouseConfigured(env({ CF_ACCESS_CLIENT_ID: "" } as Partial<Env>))).toBe(
			false,
		);
		expect(isClickHouseConfigured(env({ CF_ACCESS_CLIENT_SECRET: "" } as Partial<Env>))).toBe(
			false,
		);
	});
});

describe("safeTableName", () => {
	it("defaults when unset", () => {
		expect(safeTableName(undefined)).toBe("mcp_requests");
	});

	it("accepts plain identifiers", () => {
		expect(safeTableName("events_2026")).toBe("events_2026");
	});

	// The table name is interpolated into SQL, so anything but a bare
	// identifier must be rejected rather than escaped.
	it.each([
		"mcp_requests; DROP TABLE users",
		"mcp requests",
		"db.table",
		"1abc",
		"tbl--comment",
	])("rejects %j", (bad) => {
		expect(() => safeTableName(bad)).toThrow(/Unsafe ClickHouse table name/);
	});
});

describe("insertRows", () => {
	it("sends JSONEachRow with credentials and Access headers", async () => {
		const calls = captureFetch(new Response("", { status: 200 }));

		await insertRows(env(), "mcp_requests", [
			{ method: "tools/call" },
			{ method: "initialize" },
		]);

		expect(calls).toHaveLength(1);
		const [call] = calls;
		expect(call.url).toContain("database=mcp");
		// URLSearchParams encodes spaces as "+", which decodeURIComponent leaves alone.
		const sent = new URL(call.url).searchParams;
		expect(sent.get("query")).toBe("INSERT INTO mcp_requests FORMAT JSONEachRow");
		expect(sent.get("async_insert")).toBe("1");
		expect(sent.get("wait_for_async_insert")).toBe("1");
		expect(call.headers["X-ClickHouse-User"]).toBe("writer");
		expect(call.headers["X-ClickHouse-Key"]).toBe("secret");
		expect(call.headers["CF-Access-Client-Id"]).toBe("client-id");
		expect(call.headers["CF-Access-Client-Secret"]).toBe("client-secret");
		// One JSON object per line, no trailing newline.
		expect(call.body).toBe('{"method":"tools/call"}\n{"method":"initialize"}');
	});

	it("skips the request entirely for an empty batch", async () => {
		const calls = captureFetch(new Response("", { status: 200 }));
		await insertRows(env(), "mcp_requests", []);
		expect(calls).toHaveLength(0);
	});

	it("throws a sanitized status without the ClickHouse body", async () => {
		captureFetch(new Response("Code: 60. Unknown table", { status: 404 }));
		await expect(insertRows(env(), "mcp_requests", [{ a: 1 }])).rejects.toThrow(
			"ClickHouse request failed with HTTP 404",
		);
	});

	it("omits Access headers when no service token is set", async () => {
		const calls = captureFetch(new Response("", { status: 200 }));
		const noAccess = env({
			CF_ACCESS_CLIENT_ID: "",
			CF_ACCESS_CLIENT_SECRET: "",
		} as Partial<Env>);

		await insertRows(noAccess, "mcp_requests", [{ a: 1 }]);
		expect(calls[0].headers["CF-Access-Client-Id"]).toBeUndefined();
	});
});

describe("insertQuietly", () => {
	// A self-hosted instance being unreachable must never surface to the caller.
	it("swallows failures", async () => {
		captureFetch(new Response("boom", { status: 500 }));
		await expect(insertQuietly(env(), "mcp_requests", [{ a: 1 }])).resolves.toBeUndefined();
	});
});

describe("query", () => {
	it("returns the data array and binds params with the param_ prefix", async () => {
		const calls = captureFetch(
			new Response(JSON.stringify({ data: [{ label: "x", count: "3" }] }), { status: 200 }),
		);

		const rows = await query<{ label: string; count: string }>(env(), "SELECT 1", { days: 30 });

		expect(rows).toEqual([{ label: "x", count: "3" }]);
		expect(calls[0].url).toContain("param_days=30");
		expect(calls[0].body).toContain("FORMAT JSON");
	});

	it("returns an empty array when ClickHouse sends no data key", async () => {
		captureFetch(new Response(JSON.stringify({}), { status: 200 }));
		expect(await query(env(), "SELECT 1")).toEqual([]);
	});
});

describe("fetchUsageData", () => {
	it("splits the UNION ALL result into each breakdown", async () => {
		captureFetch(
			new Response(
				JSON.stringify({
					data: [
						{ dim: "total", label: "", count: "42" },
						{ dim: "day", label: "2026-08-13", count: "9" },
						{ dim: "day", label: "2026-08-02", count: "5" },
						{ dim: "method", label: "tools/call", count: "7" },
						{ dim: "country", label: "VN", count: "42" },
						{ dim: "client", label: "claude", count: "40" },
						{ dim: "version", label: "1.0.0", count: "40" },
						{ dim: "tool", label: "say_hi", count: "3" },
						{ dim: "resource", label: "duyet://about", count: "2" },
					],
				}),
				{ status: 200 },
			),
		);

		const data = await fetchUsageData(env());

		expect(data.total).toBe(42);
		expect(data.byMethod).toEqual([{ label: "tools/call", count: 7 }]);
		expect(data.byTool).toEqual([{ label: "say_hi", count: 3 }]);
		expect(data.byResource).toEqual([{ label: "duyet://about", count: 2 }]);
		// UNION ALL does not guarantee ordering, so the day series is re-sorted.
		expect(data.byDay.map((r) => r.label)).toEqual(["2026-08-02", "2026-08-13"]);
	});

	it("returns zeroed data for an empty table", async () => {
		captureFetch(new Response(JSON.stringify({ data: [] }), { status: 200 }));

		const data = await fetchUsageData(env());
		expect(data.total).toBe(0);
		expect(data.byDay).toEqual([]);
		expect(data.byMethod).toEqual([]);
	});

	it("fetches every breakdown in a single round trip", async () => {
		const calls = captureFetch(new Response(JSON.stringify({ data: [] }), { status: 200 }));
		await fetchUsageData(env());
		expect(calls).toHaveLength(1);
	});
});

describe("renderUsagePage", () => {
	it("does not leak ClickHouse error text when the query fails", async () => {
		const { renderUsagePage } = await import("../usage");
		captureFetch(new Response("Code: 60. DB::Exception: secret table", { status: 500 }));
		const html = await renderUsagePage(env());
		expect(html).toContain("Usage analytics are temporarily unavailable");
		expect(html).not.toContain("Code: 60");
		expect(html).not.toContain("secret table");
	});

	it("explains when ClickHouse is not configured", async () => {
		const { renderUsagePage } = await import("../usage");
		const html = await renderUsagePage(env({ CLICKHOUSE_URL: "" } as Partial<Env>));
		expect(html).toContain("Usage analytics are not configured");
	});
});
