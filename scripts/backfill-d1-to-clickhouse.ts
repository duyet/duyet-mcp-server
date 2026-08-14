/**
 * One-off backfill of the legacy D1 `usage_stats` rollups into ClickHouse.
 *
 * The D1 table stored daily rollups (one row per dimension combination with a
 * count), while ClickHouse stores raw events. Each rollup row is therefore
 * expanded into `count` events dated at noon UTC on that day. The original
 * per-request timestamps were never recorded, so intra-day time is synthetic;
 * every dashboard aggregate is by day or coarser, so nothing downstream cares.
 *
 * Events are tagged protocol_version = "d1-backfill". A second run aborts if
 * any such rows already exist, so a lost HTTP response cannot silently double
 * the history. Pass --force to override after you have cleaned those rows.
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

import { z } from "zod";

import { safeTableName } from "../src/clickhouse/usage-queries";

const BACKFILL_MARK = "d1-backfill";
/** Per insert-batch-size: 10k rows per INSERT. */
const BATCH_SIZE = 10_000;

const rollupRowSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	client: z.string(),
	client_version: z.string(),
	method: z.string(),
	tool: z.string(),
	resource: z.string(),
	country: z.string(),
	count: z.coerce.number().int().nonnegative(),
});

type RollupRow = z.infer<typeof rollupRowSchema>;

const cliSchema = z
	.object({
		dryRun: z.boolean(),
		force: z.boolean(),
		file: z.string().min(1),
	})
	.strict();

function required(name: string): string {
	const value = process.env[name];
	if (!value) {
		console.error(`Missing required environment variable: ${name}`);
		process.exit(1);
	}
	return value;
}

export function parseCli(argv: string[]): z.infer<typeof cliSchema> {
	const known = new Set(["--dry-run", "--force"]);
	const unknown = argv.filter((a) => a.startsWith("--") && !known.has(a));
	const files = argv.filter((a) => !a.startsWith("--"));
	if (unknown.length > 0 || files.length !== 1) {
		throw new Error(
			"Usage: bun run scripts/backfill-d1-to-clickhouse.ts <usage.json> [--dry-run] [--force]",
		);
	}
	return cliSchema.parse({
		dryRun: argv.includes("--dry-run"),
		force: argv.includes("--force"),
		file: files[0],
	});
}

/** wrangler --json emits [{ results: [...] }]; a plain array is also accepted. */
export function parseRows(raw: string): RollupRow[] {
	const parsed: unknown = JSON.parse(raw);
	let candidate: unknown;
	if (
		Array.isArray(parsed) &&
		parsed[0] &&
		typeof parsed[0] === "object" &&
		"results" in parsed[0]
	) {
		candidate = (parsed[0] as { results: unknown }).results;
	} else if (Array.isArray(parsed)) {
		candidate = parsed;
	} else if (parsed && typeof parsed === "object" && "results" in parsed) {
		candidate = (parsed as { results: unknown }).results;
	} else {
		throw new Error("Could not find a results array in the input file");
	}
	return z.array(rollupRowSchema).parse(candidate);
}

function eventFrom(row: RollupRow): Record<string, unknown> {
	return {
		// Noon UTC keeps the event inside the correct day in any timezone.
		timestamp: `${row.date} 12:00:00.000`,
		method: row.method,
		client_name: row.client,
		client_version: row.client_version,
		protocol_version: BACKFILL_MARK,
		tool_name: row.tool,
		resource_uri: row.resource,
		user_agent: "",
		country: row.country,
		city: "",
		asn: "",
		colo: "",
	};
}

function* eventsFromRows(rows: RollupRow[]): Generator<Record<string, unknown>> {
	for (const row of rows) {
		for (let i = 0; i < row.count; i++) {
			yield eventFrom(row);
		}
	}
}

function nextBatch(
	iter: Iterator<Record<string, unknown>>,
	size: number,
): Record<string, unknown>[] {
	const batch: Record<string, unknown>[] = [];
	for (let i = 0; i < size; i++) {
		const step = iter.next();
		if (step.done) break;
		batch.push(step.value);
	}
	return batch;
}

function clickhouseHeaders(): Record<string, string> {
	return {
		"Content-Type": "text/plain; charset=utf-8",
		"X-ClickHouse-User": required("CLICKHOUSE_USER"),
		"X-ClickHouse-Key": required("CLICKHOUSE_PASSWORD"),
		"CF-Access-Client-Id": required("CF_ACCESS_CLIENT_ID"),
		"CF-Access-Client-Secret": required("CF_ACCESS_CLIENT_SECRET"),
	};
}

function clickhouseUrl(query: string): URL {
	const url = new URL(required("CLICKHOUSE_URL"));
	url.searchParams.set("database", process.env.CLICKHOUSE_DATABASE || "mcp");
	url.searchParams.set("query", query);
	return url;
}

async function alreadyBackfilled(table: string): Promise<number> {
	const url = clickhouseUrl(
		`SELECT count() AS n FROM ${table} WHERE protocol_version = {mark:String} FORMAT JSON`,
	);
	url.searchParams.set("param_mark", BACKFILL_MARK);
	const response = await fetch(url, { method: "POST", headers: clickhouseHeaders() });
	if (!response.ok) {
		console.error(`ClickHouse query failed with HTTP ${response.status}.`);
		process.exit(1);
	}
	const parsed = (await response.json()) as { data?: { n: string | number }[] };
	return Number(parsed.data?.[0]?.n ?? 0);
}

async function insertBatch(table: string, batch: Record<string, unknown>[]): Promise<void> {
	const url = clickhouseUrl(`INSERT INTO ${table} FORMAT JSONEachRow`);
	const response = await fetch(url, {
		method: "POST",
		headers: clickhouseHeaders(),
		body: batch.map((e) => JSON.stringify(e)).join("\n"),
	});
	if (!response.ok) {
		console.error(`ClickHouse insert failed with HTTP ${response.status}.`);
		process.exit(1);
	}
}

async function main(): Promise<void> {
	const { dryRun, force, file } = parseCli(process.argv.slice(2));
	const rows = parseRows(await Bun.file(file).text());
	const table = safeTableName(process.env.CLICKHOUSE_TABLE);
	const total = rows.reduce((sum, row) => sum + row.count, 0);

	console.log(`Read ${rows.length} rollup rows, expanded to ${total} events.`);

	if (dryRun) {
		const preview: Record<string, unknown>[] = [];
		const iter = eventsFromRows(rows);
		for (let i = 0; i < 5; i++) {
			const step = iter.next();
			if (step.done) break;
			preview.push(step.value);
		}
		console.log(preview.map((e) => JSON.stringify(e)).join("\n"));
		console.log(`... (${total} total, nothing sent)`);
		return;
	}
	if (total === 0) return;

	if (!force) {
		const existing = await alreadyBackfilled(table);
		if (existing > 0) {
			console.error(
				`Refusing to insert: ${existing} d1-backfill events already exist. ` +
					"Re-run with --force only after removing them.",
			);
			process.exit(1);
		}
	}

	const iter = eventsFromRows(rows);
	let inserted = 0;
	for (;;) {
		const batch = nextBatch(iter, BATCH_SIZE);
		if (batch.length === 0) break;
		await insertBatch(table, batch);
		inserted += batch.length;
		console.log(`Inserted ${inserted} / ${total} events into ${table}.`);
	}
}

if (import.meta.main) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	});
}
