/**
 * Shared design layer for the three HTML surfaces (/, /playground, /usage).
 *
 * These pages are inline-CSS strings served by a Worker under a strict CSP,
 * so there is no build step, no utility framework and no webfont: everything
 * below is native CSS custom properties plus a system font stack.
 *
 * One accent (amber) and one radius scale are used across all three pages.
 * Amber is deliberately kept clear of green/red so it never collides with the
 * success/error semantics the playground and usage dashboard rely on.
 */

const TOKENS = `
:root {
	color-scheme: light dark;

	--sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
	--mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;

	--bg: #ffffff;
	--bg-subtle: #fafafa;
	--surface: #ffffff;
	--surface-raised: #f4f4f5;
	--border: #e4e4e7;
	--border-strong: #d4d4d8;

	--text: #18181b;
	--text-muted: #52525b;
	--text-faint: #a1a1aa;

	--accent: #b45309;
	--accent-hover: #92400e;
	--accent-fg: #ffffff;
	--accent-soft: #fef3c7;
	--accent-line: #f59e0b;

	--success: #15803d;
	--success-soft: #dcfce7;
	--danger: #b91c1c;
	--danger-soft: #fee2e2;

	--radius: 8px;
	--radius-sm: 6px;
	--shadow: 0 1px 2px rgb(24 24 27 / 0.06), 0 8px 24px -12px rgb(24 24 27 / 0.18);
}

@media (prefers-color-scheme: dark) {
	:root {
		--bg: #09090b;
		--bg-subtle: #0c0c0f;
		--surface: #111113;
		--surface-raised: #1a1a1e;
		--border: #26262b;
		--border-strong: #3f3f46;

		--text: #f4f4f5;
		--text-muted: #a1a1aa;
		--text-faint: #71717a;

		--accent: #f59e0b;
		--accent-hover: #fbbf24;
		--accent-fg: #18181b;
		--accent-soft: #2a1f0a;
		--accent-line: #f59e0b;

		--success: #4ade80;
		--success-soft: #0f2a18;
		--danger: #f87171;
		--danger-soft: #2c1214;

		--shadow: 0 1px 2px rgb(0 0 0 / 0.4), 0 8px 24px -12px rgb(0 0 0 / 0.6);
	}
}
`;

const BASE = `
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }

html { -webkit-text-size-adjust: 100%; }

body {
	font-family: var(--sans);
	font-size: 15px;
	line-height: 1.65;
	background: var(--bg);
	color: var(--text);
	-webkit-font-smoothing: antialiased;
}

h1, h2, h3 { line-height: 1.25; font-weight: 600; letter-spacing: -0.012em; }
h1 { font-size: 1.75rem; letter-spacing: -0.022em; }
h2 { font-size: 1.05rem; }
h3 { font-size: 0.9375rem; }

p { color: var(--text-muted); }
strong { color: var(--text); font-weight: 600; }

a { color: var(--text); text-decoration-color: var(--border-strong); text-underline-offset: 3px; }
a:hover { text-decoration-color: var(--accent); }

/* Focus is never removed: these pages are keyboard-driven for a lot of users. */
:focus-visible { outline: 2px solid var(--accent-line); outline-offset: 2px; border-radius: 3px; }

code, kbd, pre { font-family: var(--mono); }
code {
	font-size: 0.875em;
	background: var(--surface-raised);
	border: 1px solid var(--border);
	border-radius: 4px;
	padding: 0.1em 0.35em;
}
pre {
	background: var(--surface-raised);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: 0.875rem 1rem;
	overflow-x: auto;
	font-size: 0.8125rem;
	line-height: 1.6;
}
pre code { background: none; border: 0; padding: 0; font-size: inherit; }

.wrap { width: 100%; max-width: 880px; margin: 0 auto; padding: 0 1.25rem; }
.wrap-wide { max-width: 1120px; }

/* Site chrome shared by all three pages so they read as one product. */
.site-nav {
	border-bottom: 1px solid var(--border);
	background: var(--bg);
	position: sticky;
	top: 0;
	z-index: 10;
}
.site-nav-inner {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	height: 56px;
}
.site-nav a { text-decoration: none; }
.site-brand {
	font-family: var(--mono);
	font-size: 0.8125rem;
	font-weight: 600;
	letter-spacing: -0.01em;
	white-space: nowrap;
}
.site-links { display: flex; align-items: center; gap: 1.25rem; font-size: 0.8125rem; }
.site-links a { color: var(--text-muted); white-space: nowrap; }
.site-links a:hover { color: var(--text); }
.site-links a[aria-current="page"] { color: var(--text); font-weight: 500; }

.site-foot {
	border-top: 1px solid var(--border);
	margin-top: 4rem;
	padding: 1.5rem 0 3rem;
	font-size: 0.8125rem;
	color: var(--text-faint);
}
.site-foot a { color: var(--text-muted); }

.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.4rem;
	font: inherit;
	font-size: 0.8125rem;
	font-weight: 500;
	white-space: nowrap;
	padding: 0.5rem 0.9rem;
	border-radius: var(--radius-sm);
	border: 1px solid var(--border-strong);
	background: var(--surface);
	color: var(--text);
	cursor: pointer;
	text-decoration: none;
	transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
}
.btn:hover { border-color: var(--text-faint); background: var(--surface-raised); }
.btn:active { transform: translateY(1px); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.btn-primary { background: var(--accent); border-color: var(--accent); color: var(--accent-fg); }
.btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }

.card {
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
}

.muted { color: var(--text-muted); }
.faint { color: var(--text-faint); }
.mono { font-family: var(--mono); }
.num { font-family: var(--mono); font-variant-numeric: tabular-nums; }

@media (prefers-reduced-motion: reduce) {
	*, *::before, *::after {
		animation-duration: 0.01ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: 0.01ms !important;
	}
}

@media (max-width: 640px) {
	body { font-size: 14px; }
	h1 { font-size: 1.4rem; }
	.site-links { gap: 0.9rem; }
}
`;

export interface PageOptions {
	title: string;
	description: string;
	/** Page-specific CSS appended after the shared base. */
	css?: string;
	/** Which nav link renders as the current page. */
	current?: "home" | "playground" | "usage";
	/** Widen the content column (used by the usage dashboard). */
	wide?: boolean;
	body: string;
	/** Markup appended after the footer, e.g. dialogs and scripts. */
	tail?: string;
}

function nav(current?: string, wide?: boolean): string {
	const link = (href: string, label: string, key: string) =>
		`<a href="${href}"${current === key ? ' aria-current="page"' : ""}>${label}</a>`;
	return `<header class="site-nav">
	<div class="wrap${wide ? " wrap-wide" : ""} site-nav-inner">
		<a class="site-brand" href="/">mcp.duyet.net</a>
		<nav class="site-links">
			${link("/", "Overview", "home")}
			${link("/playground", "Playground", "playground")}
			${link("/usage", "Usage", "usage")}
			<a href="https://github.com/duyet/duyet-mcp-server">GitHub</a>
		</nav>
	</div>
</header>`;
}

function foot(wide?: boolean): string {
	return `<footer class="site-foot">
	<div class="wrap${wide ? " wrap-wide" : ""}">
		<a href="https://github.com/duyet/duyet-mcp-server">duyet/duyet-mcp-server</a> on Cloudflare Workers.
		Stateless, no cookies, <a href="/usage">public telemetry</a>.
	</div>
</footer>`;
}

/** Builds a complete self-contained document with the shared design layer. */
export function renderPage(o: PageOptions): string {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${o.title}</title>
<meta name="description" content="${o.description}">
<link rel="icon" href="https://blog.duyet.net/icon.svg">
<style>${TOKENS}${BASE}${o.css ?? ""}</style>
</head>
<body>
${nav(o.current, o.wide)}
${o.body}
${foot(o.wide)}
${o.tail ?? ""}
</body>
</html>`;
}
