/**
 * /usage - public telemetry dashboard rendered from D1 usage_stats rollups.
 * Charts are generated server-side as inline SVG so they stay fully within the
 * Worker CSP (no CDN scripts, no build step). Styling comes from the shared
 * design layer in ./ui/theme; only the chart-specific CSS lives here.
 */

import { sql } from "drizzle-orm";
import { getDb } from "./database";
import { renderPage } from "./ui/theme";

interface Row {
	label: string;
	count: number;
}

/** Categorical ramp for donut segments and bars, cycled in order. */
function color(i: number): string {
	return `var(--c${(i % 6) + 1})`;
}

function esc(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Encode a JSON value so it is safe to embed inside an HTML single-quoted attribute. */
function attrJson(v: unknown): string {
	return JSON.stringify(v)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/'/g, "&#39;");
}

/** Shared "no rows" state so a missing dimension never renders a broken chart. */
function emptySection(title: string): string {
	return `<section class="panel">
		<h2>${esc(title)}</h2>
		<p class="empty">No data yet.</p>
	</section>`;
}

/** Horizontal bar list (kept for the high-cardinality dimensions). */
function barSection(title: string, rows: Row[]): string {
	if (rows.length === 0) return emptySection(title);
	const max = Math.max(...rows.map((r) => r.count));
	const bars = rows
		.map(
			(r, i) => `
			<div class="row">
				<span class="label" title="${esc(r.label)}">${esc(r.label) || "<em>unknown</em>"}</span>
				<span class="track"><span class="bar" style="width:${Math.max(2, Math.round((r.count / max) * 100))}%;background:${color(i)}"></span></span>
				<span class="num">${r.count.toLocaleString()}</span>
			</div>`,
		)
		.join("");
	return `<section class="panel"><h2>${esc(title)}</h2><div class="bars">${bars}</div></section>`;
}

/**
 * Area/line chart for a time series (e.g. daily requests). Data is embedded as
 * JSON so a tiny inline script can draw an interactive crosshair tooltip.
 */
function areaChart(title: string, ariaLabel: string, rows: Row[]): string {
	if (rows.length === 0) return emptySection(title);
	const W = 640;
	const H = 200;
	const pl = 44;
	const pr = 10;
	const pt = 16;
	const pb = 28;
	const iw = W - pl - pr;
	const ih = H - pt - pb;
	const max = Math.max(...rows.map((r) => r.count), 1);
	const n = rows.length;
	const step = n > 1 ? iw / (n - 1) : iw;
	const X = (i: number) => pl + i * step;
	const Y = (v: number) => pt + ih - (v / max) * ih;

	const line = rows.map((r, i) => `${X(i).toFixed(1)},${Y(r.count).toFixed(1)}`).join(" ");
	const area = `${pl},${pt + ih} ${line} ${(pl + iw).toFixed(1)},${pt + ih}`;

	const gridY = [0, 0.5, 1]
		.map((f) => {
			const gy = Y(max * f);
			const label = Math.round(max * f).toLocaleString();
			return `<line x1="${pl}" y1="${gy.toFixed(1)}" x2="${(pl + iw).toFixed(1)}" y2="${gy.toFixed(1)}" class="grid" aria-hidden="true"/><text x="${pl - 7}" y="${(gy + 3).toFixed(1)}" class="axis-y">${label}</text>`;
		})
		.join("");

	// The first and last ticks sit on the plot edges, so centring them would
	// push half the label outside the viewBox and clip it.
	const edgeAnchor = (i: number) => (i === 0 ? "start" : i === n - 1 ? "end" : "middle");

	const xTicks =
		n <= 6
			? rows
					.map(
						(r, i) =>
							`<text x="${X(i).toFixed(1)}" y="${H - 8}" class="axis-x" text-anchor="${edgeAnchor(i)}">${esc(r.label)}</text>`,
					)
					.join("")
			: [0, Math.floor((n - 1) / 2), n - 1]
					.map((i) => {
						const cx = i === 0 ? X(i) - 4 : i === n - 1 ? X(i) + 4 : X(i);
						return `<text x="${cx.toFixed(1)}" y="${H - 8}" class="axis-x" text-anchor="${edgeAnchor(i)}">${esc(rows[i].label)}</text>`;
					})
					.join("");

	const dots = rows
		.map(
			(r, i) =>
				`<circle class="pt" cx="${X(i).toFixed(1)}" cy="${Y(r.count).toFixed(1)}" r="3"><title>${esc(r.label)}: ${r.count.toLocaleString()}</title></circle>`,
		)
		.join("");

	const values = rows.map((r) => ({ label: r.label, count: r.count }));

	return `<section class="panel">
		<h2>${esc(title)}</h2>
		<div class="chart chart-area" data-values="${attrJson(values)}" data-base="${pl}" data-step="${step.toFixed(3)}" data-top="${pt}" data-height="${ih}">
			<svg viewBox="0 0 ${W} ${H}" class="area-svg" role="img" aria-label="${esc(ariaLabel)}">
				<defs>
					<linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="var(--accent-line)" stop-opacity=".28"/>
						<stop offset="100%" stop-color="var(--accent-line)" stop-opacity="0"/>
					</linearGradient>
				</defs>
				${gridY}
				<polygon points="${area}" fill="url(#areaFill)"/>
				<polyline points="${line}" fill="none" stroke="var(--accent-line)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
				<line class="crosshair" x1="0" y1="0" x2="0" y2="0" aria-hidden="true"/>
				${dots}
				${xTicks}
			</svg>
		</div>
	</section>`;
}

/** Donut chart with a legend (good for proportions like country / method). */
function donutChart(title: string, ariaLabel: string, rows: Row[]): string {
	if (rows.length === 0) return emptySection(title);
	const R = 40;
	const SW = 18;
	const C = 2 * Math.PI * R;
	const total = rows.reduce((s, r) => s + r.count, 0);
	let acc = 0;
	const segs = rows
		.map((r, i) => {
			const frac = r.count / total;
			// subtract a tiny gap between segments
			const dash = Math.max(frac * C - (rows.length > 1 ? 1.5 : 0), 0);
			const offset = -acc * C;
			acc += frac;
			const pct = (frac * 100).toFixed(1);
			return `<circle class="seg" cx="60" cy="60" r="${R}" fill="none" stroke="${color(i)}" stroke-width="${SW}" stroke-linecap="butt" stroke-dasharray="${dash.toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}" transform="rotate(-90 60 60)"><title>${esc(r.label)}: ${r.count.toLocaleString()} (${pct}%)</title></circle>`;
		})
		.join("");

	const legend = rows
		.map(
			(r, i) =>
				`<div class="lg"><span class="sw" style="background:${color(i)}"></span><span class="lg-label" title="${esc(r.label)}">${esc(r.label) || "<em>unknown</em>"}</span><span class="lg-num num">${r.count.toLocaleString()}</span></div>`,
		)
		.join("");

	return `<section class="panel">
		<h2>${esc(title)}</h2>
		<div class="donut-wrap">
			<div class="donut">
				<svg viewBox="0 0 120 120" role="img" aria-label="${esc(ariaLabel)}">${segs}</svg>
				<div class="donut-center num">${total.toLocaleString()}</div>
			</div>
			<div class="legend">${legend}</div>
		</div>
	</section>`;
}

const CSS = `
:root {
	--c1: #b45309; --c2: #0f766e; --c3: #4338ca;
	--c4: #be123c; --c5: #4d7c0f; --c6: #475569;
}
@media (prefers-color-scheme: dark) {
	:root {
		--c1: #f59e0b; --c2: #2dd4bf; --c3: #818cf8;
		--c4: #fb7185; --c5: #a3e635; --c6: #94a3b8;
	}
}

main { padding: 2.5rem 0 1rem; }
.page-head { margin-bottom: 1.75rem; }
.page-head p { margin-top: 0.35rem; font-size: 0.875rem; color: var(--text-muted); }

/* Headline total leads the page: one number, read before anything else. */
.total {
	display: flex;
	flex-direction: column;
	gap: 0.15rem;
	padding: 1rem 1.25rem;
	margin-bottom: 2rem;
}
.total-label { font-size: 0.8125rem; color: var(--text-muted); }
.total-value { font-size: 2rem; font-weight: 600; letter-spacing: -0.02em; }

.panel { margin-bottom: 2rem; min-width: 0; }
.panel > h2 { margin-bottom: 0.75rem; }
.empty { font-size: 0.875rem; color: var(--text-faint); }

/* Bars: no filled background block, just a hairline track and the value. */
.bars { display: grid; gap: 0.15rem; }
.row { display: flex; align-items: center; gap: 0.75rem; padding: 0.15rem 0; }
.label {
	flex: 0 0 10rem;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 0.8125rem;
	color: var(--text-muted);
}
.track { flex: 1; min-width: 0; height: 8px; border-radius: 2px; background: var(--border); }
.bar { display: block; height: 100%; border-radius: 2px; }
.num { font-variant-numeric: tabular-nums; font-family: var(--mono); }
.row .num { flex: 0 0 4.5rem; text-align: right; font-size: 0.8125rem; color: var(--text); }

/* Area chart */
.chart svg { width: 100%; height: auto; display: block; }
.grid { stroke: var(--border); stroke-width: 1; }
.axis-y { fill: var(--text-faint); font-size: 9px; text-anchor: end; font-family: var(--mono); }
.axis-x { fill: var(--text-faint); font-size: 9px; font-family: var(--mono); }
.pt { fill: var(--accent-line); }
.crosshair { stroke: var(--border-strong); stroke-width: 1; stroke-dasharray: 3 3; opacity: 0; }

/* Donut */
.donut-wrap { display: flex; gap: 1.25rem; align-items: center; }
.donut { position: relative; width: 132px; flex: 0 0 auto; }
.donut svg { width: 100%; height: auto; display: block; }
.donut-center {
	position: absolute;
	inset: 0;
	display: grid;
	place-items: center;
	font-size: 1rem;
	font-weight: 600;
}
.legend { flex: 1; min-width: 0; }
.lg { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; padding: 0.15rem 0; }
.sw { flex: 0 0 10px; width: 10px; height: 10px; border-radius: 2px; }
.lg-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-muted); }
.lg-num { margin-left: auto; white-space: nowrap; color: var(--text); }

.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1.75rem; }

.tooltip {
	position: fixed;
	pointer-events: none;
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius-sm);
	box-shadow: var(--shadow);
	padding: 0.35rem 0.6rem;
	font-family: var(--mono);
	font-size: 0.75rem;
	font-variant-numeric: tabular-nums;
	color: var(--text);
	opacity: 0;
	transition: opacity 0.1s ease;
	z-index: 20;
	white-space: nowrap;
}

@media (max-width: 720px) {
	.charts-grid { grid-template-columns: 1fr; }
	.donut-wrap { flex-direction: column; align-items: flex-start; }
	.label { flex-basis: 7rem; }
}
`;

const TAIL = `<div class="tooltip" id="tip"></div>
<script>
(() => {
	const tip = document.getElementById("tip");
	const charts = document.querySelectorAll(".chart-area");
	for (const chart of charts) {
		const svg = chart.querySelector("svg");
		const cross = svg.querySelector(".crosshair");
		const values = JSON.parse(chart.dataset.values || "[]");
		const base = Number(chart.dataset.base || 0);
		const step = Number(chart.dataset.step || 0);
		const top = Number(chart.dataset.top || 0);
		const height = Number(chart.dataset.height || 0);
		if (!values.length) continue;
		const show = () => { tip.style.opacity = "1"; cross.setAttribute("opacity", "1"); };
		const hide = () => { tip.style.opacity = "0"; cross.setAttribute("opacity", "0"); };
		svg.addEventListener("mousemove", (e) => {
			const r = svg.getBoundingClientRect();
			const fx = (e.clientX - r.left) / r.width;
			if (fx < 0 || fx > 1) { hide(); return; }
			let i = Math.round(fx * (values.length - 1));
			i = Math.max(0, Math.min(values.length - 1, i));
			const v = values[i];
			const cx = base + i * step;
			cross.setAttribute("x1", cx);
			cross.setAttribute("x2", cx);
			cross.setAttribute("y1", top);
			cross.setAttribute("y2", top + height);
			tip.textContent = v.label + ": " + v.count.toLocaleString();
			tip.style.left = Math.min(e.clientX + 12, window.innerWidth - 140) + "px";
			tip.style.top = (e.clientY - 10) + "px";
			show();
		});
		svg.addEventListener("mouseleave", hide);
	}
})();
</script>`;

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

	const [total, byDay, byClient, byVersion, byMethod, byTool, byResource, byCountry] =
		await Promise.all([
			db.all<{ c: number }>(sql.raw("SELECT SUM(count) AS c FROM usage_stats")),
			query("date", "1=1", 30).then((rows) =>
				rows.sort((a, b) => a.label.localeCompare(b.label)),
			),
			query("client"),
			query("client_version", "client_version != ''"),
			query("method"),
			query("tool", "tool != ''"),
			query("resource", "resource != ''"),
			query("country", "country != ''"),
		]);

	const totalCount = Number(total[0]?.c ?? 0);

	const body = `
<main>
	<div class="wrap wrap-wide">
		<div class="page-head">
			<h1>Usage</h1>
			<p>Daily rollups from D1, updated in real time and cached for 5 minutes.</p>
		</div>

		<div class="card total">
			<span class="total-label">Total tracked requests</span>
			<span class="total-value num">${totalCount.toLocaleString()}</span>
		</div>

		${areaChart("Requests per day (last 30)", "Requests per day over the last 30 days", byDay)}

		<div class="charts-grid">
			${donutChart("By MCP method", "Share of requests by MCP method", byMethod)}
			${donutChart("By country", "Share of requests by country", byCountry)}
		</div>

		<div class="charts-grid">
			${barSection("By client", byClient)}
			${barSection("By client version", byVersion)}
		</div>

		${barSection("By tool", byTool)}
		${barSection("By resource", byResource)}
	</div>
</main>
`;

	return renderPage({
		title: "Usage · Duyet MCP Server",
		description:
			"Public telemetry for the Duyet MCP server: requests per day, client, tool and country.",
		current: "usage",
		wide: true,
		css: CSS,
		body,
		tail: TAIL,
	});
}
