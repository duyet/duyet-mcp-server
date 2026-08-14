/**
 * Aggregate queries backing the /usage dashboard.
 *
 * Every breakdown is fetched in a single round trip via UNION ALL, tagged with
 * a `dim` column. The instance sits at the end of a home tunnel, so one request
 * of ~8 small aggregates beats eight separate requests by a wide margin.
 */

import { query } from "./client";

export interface Row {
	label: string;
	count: number;
}

export interface UsageData {
	total: number;
	byDay: Row[];
	byMethod: Row[];
	byCountry: Row[];
	byClient: Row[];
	byVersion: Row[];
	byTool: Row[];
	byResource: Row[];
}

const EMPTY: UsageData = {
	total: 0,
	byDay: [],
	byMethod: [],
	byCountry: [],
	byClient: [],
	byVersion: [],
	byTool: [],
	byResource: [],
};

/** Identifiers cannot be bound as query parameters, so restrict them to a safe shape. */
export function safeTableName(name: string | undefined): string {
	const candidate = name || "mcp_requests";
	if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(candidate)) {
		throw new Error(`Unsafe ClickHouse table name: ${candidate}`);
	}
	return candidate;
}

/** Rows are grouped by `dim`; each breakdown keeps its own top-N cut. */
interface DimRow {
	dim: string;
	label: string;
	count: string | number;
}

const DAYS = 30;
const TOP_N = 20;

function buildSql(table: string): string {
	// Each breakdown excludes rows whose dimension is empty, since a blank
	// client or tool name means "not applicable to this method" rather than a
	// real category. The day series and the total intentionally count everything.
	const breakdown = (dim: string, column: string) =>
		`(SELECT '${dim}' AS dim, ${column} AS label, toUInt64(count()) AS count
		  FROM ${table} WHERE ${column} != '' GROUP BY ${column}
		  ORDER BY count DESC LIMIT ${TOP_N})`;

	return [
		`(SELECT 'total' AS dim, '' AS label, toUInt64(count()) AS count FROM ${table})`,
		`(SELECT 'day' AS dim, toString(date) AS label, toUInt64(count()) AS count
		  FROM ${table} WHERE date >= today() - ${DAYS - 1} GROUP BY date ORDER BY date)`,
		breakdown("method", "method"),
		breakdown("country", "country"),
		breakdown("client", "client_name"),
		breakdown("version", "client_version"),
		breakdown("tool", "tool_name"),
		breakdown("resource", "resource_uri"),
	].join("\nUNION ALL\n");
}

function pick(rows: DimRow[], dim: string): Row[] {
	return rows
		.filter((r) => r.dim === dim)
		.map((r) => ({ label: r.label, count: Number(r.count) }));
}

/**
 * Fetch every dashboard aggregate. Throws if ClickHouse is unreachable so the
 * caller can render a clear failure rather than a silently empty dashboard.
 */
export async function fetchUsageData(env: Env): Promise<UsageData> {
	const table = safeTableName(env.CLICKHOUSE_TABLE);
	const rows = await query<DimRow>(env, buildSql(table));

	if (rows.length === 0) return EMPTY;

	// The day series must stay in chronological order for the area chart; the
	// UNION ALL does not guarantee ordering across branches, so re-sort here.
	const byDay = pick(rows, "day").sort((a, b) => a.label.localeCompare(b.label));

	return {
		total: pick(rows, "total")[0]?.count ?? 0,
		byDay,
		byMethod: pick(rows, "method"),
		byCountry: pick(rows, "country"),
		byClient: pick(rows, "client"),
		byVersion: pick(rows, "version"),
		byTool: pick(rows, "tool"),
		byResource: pick(rows, "resource"),
	};
}
