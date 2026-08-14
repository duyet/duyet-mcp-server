/**
 * Minimal ClickHouse client over the HTTP interface.
 *
 * Hyperdrive is not an option here: it supports only PostgreSQL and MySQL
 * engines, and ClickHouse's Postgres port does not fully implement the extended
 * query protocol those drivers rely on. The HTTP interface is also the better
 * fit for this workload, which is fire-and-forget inserts plus a handful of
 * aggregate reads: there are no long-lived connections for Hyperdrive to pool.
 *
 * The instance is private and reached through a Cloudflare Tunnel fronted by
 * Access, so every request carries both the Access service-token pair and the
 * ClickHouse credentials.
 */

import { logger } from "../utils/logger";

/** Set when the ClickHouse sink is fully configured; otherwise tracking is skipped. */
export function isClickHouseConfigured(env: Env): boolean {
	return Boolean(env.CLICKHOUSE_URL && env.CLICKHOUSE_USER && env.CLICKHOUSE_PASSWORD);
}

function endpoint(env: Env, params: Record<string, string> = {}): string {
	const url = new URL(env.CLICKHOUSE_URL);
	url.searchParams.set("database", env.CLICKHOUSE_DATABASE || "default");
	for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
	return url.toString();
}

function headers(env: Env): Record<string, string> {
	const h: Record<string, string> = {
		"Content-Type": "text/plain; charset=utf-8",
		// Credentials go in headers rather than the query string so they never
		// land in ClickHouse's query_log or any intermediate access log.
		"X-ClickHouse-User": env.CLICKHOUSE_USER,
		"X-ClickHouse-Key": env.CLICKHOUSE_PASSWORD,
	};
	if (env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
		h["CF-Access-Client-Id"] = env.CF_ACCESS_CLIENT_ID;
		h["CF-Access-Client-Secret"] = env.CF_ACCESS_CLIENT_SECRET;
	}
	return h;
}

async function exec(env: Env, body: string, params?: Record<string, string>): Promise<Response> {
	const response = await fetch(endpoint(env, params), {
		method: "POST",
		headers: headers(env),
		body,
	});

	if (!response.ok) {
		// ClickHouse returns the failure reason as plain text in the body.
		const detail = (await response.text().catch(() => "")).slice(0, 400);
		throw new Error(`ClickHouse ${response.status}: ${detail}`);
	}
	return response;
}

/**
 * Insert rows using JSONEachRow. Values are sent as JSON, so nothing is
 * concatenated into SQL and there is no injection surface.
 */
export async function insertRows(
	env: Env,
	table: string,
	rows: Record<string, unknown>[],
): Promise<void> {
	if (rows.length === 0) return;
	const payload = rows.map((r) => JSON.stringify(r)).join("\n");
	await exec(env, payload, { query: `INSERT INTO ${table} FORMAT JSONEachRow` });
}

interface JsonResponse<T> {
	data: T[];
}

/**
 * Run a SELECT and return the rows.
 *
 * `sql` must be a trusted, statically-built string. Anything derived from user
 * input belongs in `queryParams` and must be referenced with ClickHouse's
 * {name:Type} placeholder syntax so the server does the substitution.
 */
export async function query<T>(
	env: Env,
	sql: string,
	queryParams: Record<string, string | number> = {},
): Promise<T[]> {
	const params: Record<string, string> = { default_format: "JSON" };
	for (const [k, v] of Object.entries(queryParams)) params[`param_${k}`] = String(v);

	const response = await exec(env, `${sql} FORMAT JSON`, params);
	const parsed = (await response.json()) as JsonResponse<T>;
	return parsed.data ?? [];
}

/**
 * Fire-and-forget wrapper: never throws, so a home instance being unreachable
 * can never take the MCP endpoint down with it.
 */
export async function insertQuietly(
	env: Env,
	table: string,
	rows: Record<string, unknown>[],
): Promise<void> {
	try {
		await insertRows(env, table, rows);
	} catch (error) {
		logger.warn("database", "ClickHouse insert failed", {
			error: error instanceof Error ? error.message : String(error),
		});
	}
}
