/**
 * / - overview page: what this MCP server is, how to connect, what it exposes.
 * Styling comes from the shared design layer in ./ui/theme.
 */

import { renderPage } from "./ui/theme";

const CSS = `
.hero { padding: 4.5rem 0 3.5rem; border-bottom: 1px solid var(--border); }
.hero h1 { font-size: clamp(1.9rem, 5vw, 2.6rem); max-width: 16ch; }
.hero p { margin-top: 0.9rem; max-width: 56ch; font-size: 1.0625rem; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1.75rem; }

section { padding: 3rem 0; border-bottom: 1px solid var(--border); }
section:last-of-type { border-bottom: 0; }
section > h2 { margin-bottom: 1.25rem; }

/* Endpoint strip: the single most-copied string on the page. */
.endpoint {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex-wrap: wrap;
	padding: 0.75rem 0.75rem 0.75rem 1rem;
	border: 1px solid var(--border-strong);
	border-radius: var(--radius);
	background: var(--surface-raised);
	margin-bottom: 1.5rem;
}
.endpoint-url { font-family: var(--mono); font-size: 0.875rem; flex: 1 1 auto; word-break: break-all; }
.endpoint-note { font-size: 0.8125rem; color: var(--text-faint); }

.clients { display: grid; gap: 1.25rem; }
.client-name { font-size: 0.8125rem; font-weight: 600; margin-bottom: 0.4rem; }

/* Reference tables: this is API documentation, so a table is the honest shape. */
.ref { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.ref th, .ref td { padding: 0.6rem 0.75rem 0.6rem 0; vertical-align: top; text-align: left; border-bottom: 1px solid var(--border); }
.ref thead th { font-size: 0.75rem; font-weight: 600; color: var(--text-faint); padding-top: 0; }
.ref tbody tr:last-child td { border-bottom: 0; }
.ref th:first-child, .ref td:first-child { width: 34%; white-space: nowrap; }
.ref td:first-child code { background: none; border: 0; padding: 0; color: var(--accent); font-weight: 500; }
.ref td:last-child { color: var(--text-muted); }

.split { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; }

.chat { border-left: 2px solid var(--accent-line); padding-left: 1.1rem; display: grid; gap: 0.85rem; }
.chat-turn { font-size: 0.9375rem; }
.chat-who { font-family: var(--mono); font-size: 0.75rem; color: var(--text-faint); display: block; }
.chat-act { color: var(--text-faint); font-family: var(--mono); font-size: 0.8125rem; }

.links { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; font-size: 0.875rem; }
.agent-note { font-size: 0.875rem; color: var(--text-muted); max-width: 60ch; }

@media (max-width: 720px) {
	.split { grid-template-columns: 1fr; gap: 2rem; }
	.hero { padding: 3rem 0 2.5rem; }
	.ref td:first-child { width: 40%; white-space: normal; }
}
`;

const TOOLS: [string, string][] = [
	["github_activity", "Recent commits, pull requests, issues and releases"],
	["get_blog_post_content", "Full article text for a given blog URL"],
	["send_message", "Send Duyet a message, forwarded directly"],
	["hire_me", "Paste a job description and it reaches Duyet"],
	["say_hi", "Send a short greeting"],
	["get_analytics", "Contact submission analytics"],
];

const RESOURCES: [string, string][] = [
	["duyet://about", "Profile, skills, availability and links"],
	["duyet://cv/{format}", "CV as summary, detailed or json"],
	["duyet://blog/posts/{limit}", "Latest blog posts"],
	["duyet://projects/{limit}", "Open source projects ranked by stars"],
	["duyet://github-activity", "Recent GitHub activity"],
	["duyet://blog/llms.txt", "Index of every published blog post"],
];

const refTable = (nameLabel: string, rows: [string, string][]) =>
	`<table class="ref">
		<thead><tr><th scope="col">${nameLabel}</th><th scope="col">Description</th></tr></thead>
		<tbody>${rows.map(([k, v]) => `<tr><td><code>${k}</code></td><td>${v}</td></tr>`).join("")}</tbody>
	</table>`;

const BODY = `
<main>
	<div class="wrap">
		<div class="hero">
			<h1>An MCP server for asking about Duyet</h1>
			<p>Connect your assistant to a live endpoint that serves Duyet's CV, blog, open source
			projects and GitHub activity, and lets you send him a message.</p>
			<div class="hero-actions">
				<a class="btn btn-primary" href="/playground">Open playground</a>
				<button class="btn" id="copy-endpoint" type="button" data-url="https://mcp.duyet.net/mcp">Copy endpoint</button>
			</div>
		</div>

		<section>
			<h2>Connect</h2>
			<div class="endpoint">
				<span class="endpoint-url">https://mcp.duyet.net/mcp</span>
				<span class="endpoint-note">Streamable HTTP</span>
			</div>
			<div class="clients">
				<div>
					<div class="client-name">Claude Code</div>
					<pre><code>claude mcp add --transport http duyet https://mcp.duyet.net/mcp</code></pre>
				</div>
				<div>
					<div class="client-name">Claude Desktop and claude.ai</div>
					<pre><code>Settings &gt; Connectors &gt; Add custom connector &gt; https://mcp.duyet.net/mcp</code></pre>
				</div>
				<div>
					<div class="client-name">Cursor, Windsurf, VS Code, Zed</div>
					<pre><code>{ "mcpServers": { "duyet": { "url": "https://mcp.duyet.net/mcp" } } }</code></pre>
				</div>
			</div>
		</section>

		<section>
			<h2>What it exposes</h2>
			<div class="split">
				<div>
					<h3>Tools</h3>
					${refTable("Tool", TOOLS)}
				</div>
				<div>
					<h3>Resources</h3>
					${refTable("URI", RESOURCES)}
				</div>
			</div>
		</section>

		<section>
			<h2>What it looks like in a chat</h2>
			<div class="chat">
				<div class="chat-turn">
					<span class="chat-who">you</span>
					Who is Duyet and what is he working on?
				</div>
				<div class="chat-turn">
					<span class="chat-who">assistant</span>
					<span class="chat-act">reads duyet://about and duyet://github-activity</span><br>
					Duyet is a senior data engineer with 9 years of experience, currently working on
					MCP servers and ClickHouse tooling.
				</div>
				<div class="chat-turn">
					<span class="chat-who">you</span>
					We are hiring. Here is the job description.
				</div>
				<div class="chat-turn">
					<span class="chat-who">assistant</span>
					<span class="chat-act">calls hire_me</span><br>
					Sent. Duyet will receive the description with a reference ID.
				</div>
			</div>
		</section>

		<section>
			<h2>For agents</h2>
			<p class="agent-note">
				Machine-readable metadata for OAuth-aware MCP clients:
				<a href="/.well-known/oauth-protected-resource">/.well-known/oauth-protected-resource</a>.
				Developer docs: <a href="https://duyet.net/developers">duyet.net/developers</a>.
			</p>
		</section>

		<section>
			<h2>Elsewhere</h2>
			<div class="links">
				<a href="/llms.txt">/llms.txt</a>
				<a href="https://duyet.net">duyet.net</a>
				<a href="https://blog.duyet.net">blog</a>
				<a href="https://duyet.net/cv">cv</a>
				<a href="https://github.com/duyet">github</a>
				<a href="https://x.com/_duyet">x</a>
				<a href="https://linkedin.com/in/duyet">linkedin</a>
			</div>
		</section>
	</div>
</main>
`;

const TAIL = `<script>
(function () {
	var btn = document.getElementById("copy-endpoint");
	if (!btn || !navigator.clipboard) return;
	btn.addEventListener("click", function () {
		var original = btn.textContent;
		var restore = function () {
			setTimeout(function () { btn.textContent = original; }, 1600);
		};
		navigator.clipboard.writeText(btn.dataset.url).then(
			function () { btn.textContent = "Copied"; restore(); },
			function () { btn.textContent = "Copy failed"; restore(); },
		);
	});
})();
</script>`;

export function renderHomePage(): string {
	return renderPage({
		title: "Duyet MCP Server",
		description:
			"MCP server exposing Duyet's CV, blog, projects and contact tools to AI assistants.",
		current: "home",
		css: CSS,
		body: BODY,
		tail: TAIL,
	});
}
