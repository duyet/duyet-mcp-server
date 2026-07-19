/**
 * /usage — public telemetry dashboard rendered from D1 usage_stats rollups.
 * Self-contained HTML (inline CSS, no external assets), cached 5 minutes.
 */

import { sql } from "drizzle-orm";
import { getDb } from "./database";

interface Row {
	label: string;
	count: number;
}

function esc(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function barSection(title: string, rows: Row[]): string {
	if (rows.length === 0) return "";
	const max = Math.max(...rows.map((r) => r.count));
	const bars = rows
		.map(
			(r) => `
			<div class="row">
				<span class="label" title="${esc(r.label)}">${esc(r.label) || "<em>unknown</em>"}</span>
				<span class="track"><span class="bar" style="width:${Math.max(2, Math.round((r.count / max) * 100))}%"></span></span>
				<span class="num">${r.count.toLocaleString()}</span>
			</div>`,
		)
		.join("");
	return `<section><h2>${esc(title)}</h2>${bars}</section>`;
}

export async function renderUsagePage(env: Env): Promise<string> {
	const db = getDb(env.DB);

	const query = async (labelExpr: string, where = "1=1", limit = 10): Promise<Row[]> => {
		const result = await db.all<{ label: string; count: number }>(
			sql.raw(
				`SELECT ${labelExpr} AS label, SUM(count) AS count FROM usage_stats WHERE ${where} GROUP BY label ORDER BY count DESC LIMIT ${limit}`,
			),
		);
		return result.map((r) => ({ label: String(r.label ?? ""), count: Number(r.count) }));
	};

	const [total, byDay, byClient, byMethod, byTool, byResource, byCountry] = await Promise.all([
		db.all<{ c: number }>(sql.raw("SELECT SUM(count) AS c FROM usage_stats")),
		query("date", "1=1", 30).then((rows) =>
			rows.sort((a, b) => a.label.localeCompare(b.label)),
		),
		query("client"),
		query("method"),
		query("tool", "tool != ''"),
		query("resource", "resource != ''"),
		query("country", "country != ''"),
	]);

	const totalCount = Number(total[0]?.c ?? 0);

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Duyet MCP Server — Usage</title>
<style>
	:root { color-scheme: light dark; --fg: #1a1a2e; --muted: #6b7280; --bar: #6366f1; --track: #e5e7eb; --bg: #ffffff; --card: #f8fafc; }
	@media (prefers-color-scheme: dark) { :root { --fg: #e5e7eb; --muted: #9ca3af; --bar: #818cf8; --track: #27272a; --bg: #111113; --card: #1a1a1e; } }
	* { box-sizing: border-box; margin: 0; }
	body { font: 15px/1.6 ui-sans-serif, system-ui, sans-serif; color: var(--fg); background: var(--bg); max-width: 720px; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }
	h1 { font-size: 1.4rem; margin-bottom: .25rem; }
	.sub { color: var(--muted); margin-bottom: 2rem; }
	.total { background: var(--card); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 2rem; }
	.total strong { font-size: 1.8rem; font-variant-numeric: tabular-nums; }
	section { margin-bottom: 2rem; }
	h2 { font-size: .85rem; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin-bottom: .6rem; }
	.row { display: flex; align-items: center; gap: .75rem; padding: .2rem 0; }
	.label { flex: 0 0 11rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .85rem; }
	.track { flex: 1; background: var(--track); border-radius: 4px; height: 10px; overflow: hidden; }
	.bar { display: block; height: 100%; background: var(--bar); border-radius: 4px; }
	.num { flex: 0 0 4rem; text-align: right; font-variant-numeric: tabular-nums; font-size: .85rem; color: var(--muted); }
	footer { color: var(--muted); font-size: .8rem; margin-top: 3rem; }
	a { color: var(--bar); }
</style>
</head>
<body>
	<h1>Duyet MCP Server — Usage</h1>
	<p class="sub">Daily rollups from D1 · updates in real time · cached 5 min</p>
	<div class="total">Total tracked requests<br><strong>${totalCount.toLocaleString()}</strong></div>
	${barSection("Requests per day (last 30)", byDay)}
	${barSection("By client", byClient)}
	${barSection("By MCP method", byMethod)}
	${barSection("By tool", byTool)}
	${barSection("By resource", byResource)}
	${barSection("By country", byCountry)}
	<footer>Powered by <a href="https://github.com/duyet/duyet-mcp-server">duyet-mcp-server</a> on Cloudflare Workers · Connect: <code>https://mcp.duyet.net/mcp</code></footer>
</body>
</html>`;
}
