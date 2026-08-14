import { describe, expect, it } from "bun:test";

import { parseCli, parseRows } from "../../scripts/backfill-d1-to-clickhouse";

describe("parseCli", () => {
	it("accepts a file and optional flags", () => {
		expect(parseCli(["/tmp/usage.json"])).toEqual({
			dryRun: false,
			force: false,
			file: "/tmp/usage.json",
		});
		expect(parseCli(["/tmp/usage.json", "--dry-run", "--force"])).toEqual({
			dryRun: true,
			force: true,
			file: "/tmp/usage.json",
		});
	});

	it("rejects unknown flags and extra paths", () => {
		expect(() => parseCli(["--unknown", "/tmp/usage.json"])).toThrow(/Usage:/);
		expect(() => parseCli(["/tmp/one.json", "/tmp/two.json"])).toThrow(/Usage:/);
		expect(() => parseCli(["--dry-run"])).toThrow(/Usage:/);
	});
});

describe("parseRows", () => {
	const row = {
		date: "2026-01-01",
		client: "claude",
		client_version: "1.0.0",
		method: "tools/call",
		tool: "say_hi",
		resource: "",
		country: "VN",
		count: 2,
	};

	it("accepts a wrangler --json envelope and a plain array", () => {
		expect(parseRows(JSON.stringify([{ results: [row] }]))).toEqual([row]);
		expect(parseRows(JSON.stringify([row]))).toEqual([row]);
		expect(parseRows(JSON.stringify({ results: [row] }))).toEqual([row]);
	});

	it("rejects malformed rollup rows", () => {
		expect(() => parseRows(JSON.stringify({ results: {} }))).toThrow();
		expect(() => parseRows(JSON.stringify([{ ...row, date: "not-a-date" }]))).toThrow();
		expect(() => parseRows(JSON.stringify([{ ...row, count: -1 }]))).toThrow();
		expect(() => parseRows(JSON.stringify([{ ...row, count: 1.5 }]))).toThrow();
	});
});
