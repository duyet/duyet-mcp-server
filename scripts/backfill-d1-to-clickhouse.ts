/**
 * One-off backfill of the legacy D1 `usage_stats` rollups into ClickHouse.
 *
 * The D1 table stored daily rollups (one row per dimension combination with a
 * count), while ClickHouse stores raw events. Each rollup row is therefore
 * expanded into `count` events dated at noon UTC on that day. The original
 * per-request timestamps were never recorded, so intra-day time is synthetic;
 * every dashboard aggregate is by day or coarser, so nothing downstream cares.
 *
 * Usage:
 *   wrangler d1 execute duyet-mcp-contacts --remote --json \
 *     --command "SELECT * FROM usage_stats" > /tmp/usage.json
 *
 *   CLICKHOUSE_URL=https://clickhouse.example.net \
 *   CLICKHOUSE_USER=writer CLICKHOUSE_PASSWORD=... \
 *   CF_ACCESS_CLIENT_ID=... CF_ACCESS_CLIENT_SECRET=... \
 *   bun run scripts/backfill-d1-to-clickhouse.ts /tmp/usage.json
 *
 * Pass --dry-run to print what would be sent without writing anything.
 */

interface RollupRow {
	date: string;
	client: string;
	client_version: string;
	method: string;
	tool: string;
	resource: string;
	country: string;
	count: number;
}

function required(name: string): string {
	const value = process.env[name];
	if (!value) {
		console.error(`Missing required environment variable: ${name}`);
		process.exit(1);
	}
	return value;
}

/** wrangler --json emits [{ results: [...] }]; a plain array is also accepted. */
function parseRows(raw: string): RollupRow[] {
	const parsed = JSON.parse(raw);
	if (Array.isArray(parsed) && parsed[0]?.results) return parsed[0].results;
	if (Array.isArray(parsed)) return parsed;
	if (parsed?.results) return parsed.results;
	throw new Error("Could not find a results array in the input file");
}

function expand(rows: RollupRow[]): Record<string, unknown>[] {
	const events: Record<string, unknown>[] = [];

	for (const row of rows) {
		const count = Number(row.count) || 0;
		for (let i = 0; i < count; i++) {
			events.push({
				// Noon UTC keeps the event inside the correct day in any timezone.
				timestamp: `${row.date} 12:00:00.000`,
				method: row.method ?? "",
				client_name: row.client ?? "",
				client_version: row.client_version ?? "",
				protocol_version: "",
				tool_name: row.tool ?? "",
				resource_uri: row.resource ?? "",
				user_agent: "",
				country: row.country ?? "",
				city: "",
				asn: "",
				colo: "",
				ip_hash: "",
			});
		}
	}
	return events;
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const dryRun = args.includes("--dry-run");
	const file = args.find((a) => !a.startsWith("--"));

	if (!file) {
		console.error(
			"Usage: bun run scripts/backfill-d1-to-clickhouse.ts <usage.json> [--dry-run]",
		);
		process.exit(1);
	}

	const rows = parseRows(await Bun.file(file).text());
	const events = expand(rows);
	const table = process.env.CLICKHOUSE_TABLE || "mcp_requests";

	console.log(`Read ${rows.length} rollup rows, expanded to ${events.length} events.`);

	if (dryRun) {
		console.log(
			events
				.slice(0, 5)
				.map((e) => JSON.stringify(e))
				.join("\n"),
		);
		console.log(`... (${events.length} total, nothing sent)`);
		return;
	}
	if (events.length === 0) return;

	const url = new URL(required("CLICKHOUSE_URL"));
	url.searchParams.set("database", process.env.CLICKHOUSE_DATABASE || "mcp");
	url.searchParams.set("query", `INSERT INTO ${table} FORMAT JSONEachRow`);

	const headers: Record<string, string> = {
		"Content-Type": "text/plain; charset=utf-8",
		"X-ClickHouse-User": required("CLICKHOUSE_USER"),
		"X-ClickHouse-Key": required("CLICKHOUSE_PASSWORD"),
	};
	if (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET) {
		headers["CF-Access-Client-Id"] = process.env.CF_ACCESS_CLIENT_ID;
		headers["CF-Access-Client-Secret"] = process.env.CF_ACCESS_CLIENT_SECRET;
	}

	const response = await fetch(url, {
		method: "POST",
		headers,
		body: events.map((e) => JSON.stringify(e)).join("\n"),
	});

	if (!response.ok) {
		console.error(`ClickHouse ${response.status}: ${await response.text()}`);
		process.exit(1);
	}
	console.log(`Inserted ${events.length} events into ${table}.`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
