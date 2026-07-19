/**
 * / — minimal black & white landing page: what this MCP server is,
 * how to connect, tools/resources, an example conversation, and links.
 * Fully self-contained (inline CSS only).
 */

export function renderHomePage(): string {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Duyet MCP Server</title>
<meta name="description" content="MCP server exposing Duyet's CV, blog, projects and contact tools to AI assistants.">
<style>
	:root { color-scheme: light dark; }
	* { box-sizing: border-box; margin: 0; }
	body { font: 16px/1.7 ui-monospace, "SF Mono", Menlo, monospace; background: #fff; color: #111; max-width: 680px; margin: 0 auto; padding: 3rem 1.25rem 5rem; }
	@media (prefers-color-scheme: dark) { body { background: #0a0a0a; color: #e8e8e8; } pre, code, .chat { background: #161616 !important; border-color: #2a2a2a !important; } th, td { border-color: #2a2a2a !important; } hr { border-color: #2a2a2a !important; } }
	h1 { font-size: 1.5rem; margin-bottom: .5rem; }
	h2 { font-size: 1.05rem; margin: 2.5rem 0 .75rem; text-transform: uppercase; letter-spacing: .08em; }
	p { margin-bottom: 1rem; }
	a { color: inherit; }
	pre { background: #f5f5f5; border: 1px solid #ddd; padding: .75rem 1rem; overflow-x: auto; font-size: .85rem; margin-bottom: 1rem; }
	code { background: #f5f5f5; padding: .1em .35em; font-size: .9em; }
	pre code { background: none; padding: 0; }
	table { border-collapse: collapse; width: 100%; font-size: .875rem; margin-bottom: 1rem; }
	th, td { border: 1px solid #ddd; padding: .4rem .6rem; text-align: left; vertical-align: top; }
	th { font-weight: 600; }
	.chat { background: #f5f5f5; border: 1px solid #ddd; padding: 1rem; font-size: .875rem; margin-bottom: 1rem; }
	.chat b { display: inline-block; min-width: 4.5rem; }
	.chat p { margin-bottom: .6rem; }
	hr { border: 0; border-top: 1px solid #ddd; margin: 2.5rem 0; }
	footer { font-size: .8rem; margin-top: 3rem; }
	ul { margin: 0 0 1rem 1.2rem; }
</style>
</head>
<body>
	<h1>Duyet MCP Server</h1>
	<p>A <a href="https://modelcontextprotocol.io">Model Context Protocol</a> server that lets AI assistants ask about
	<a href="https://duyet.net">Duyet</a> — Sr. Data Engineer — his CV, blog, projects, GitHub activity — and send him messages.</p>

	<h2>Connect</h2>
	<p>Endpoint: <code>https://mcp.duyet.net/mcp</code> (Streamable HTTP)</p>
	<pre><code># Claude Code
claude mcp add --transport http duyet https://mcp.duyet.net/mcp

# Claude Desktop / claude.ai
Settings &gt; Connectors &gt; Add custom connector &gt; https://mcp.duyet.net/mcp

# Cursor / Windsurf / VS Code / Zed (mcp.json)
{ "mcpServers": { "duyet": { "url": "https://mcp.duyet.net/mcp" } } }</code></pre>

	<h2>Tools</h2>
	<table>
		<tr><th>Tool</th><th>What it does</th></tr>
		<tr><td><code>github_activity</code></td><td>Recent commits, PRs, issues, releases</td></tr>
		<tr><td><code>get_blog_post_content</code></td><td>Full article content from a blog URL</td></tr>
		<tr><td><code>send_message</code></td><td>Send Duyet a message (forwarded directly)</td></tr>
		<tr><td><code>hire_me</code></td><td>Hiring info — paste a job description and it reaches Duyet</td></tr>
		<tr><td><code>say_hi</code></td><td>Send a friendly greeting</td></tr>
		<tr><td><code>get_analytics</code></td><td>Contact submission analytics</td></tr>
	</table>

	<h2>Resources</h2>
	<table>
		<tr><th>URI</th><th>Content</th></tr>
		<tr><td><code>duyet://about</code></td><td>Profile, skills, open-to-work, links</td></tr>
		<tr><td><code>duyet://cv/{format}</code></td><td>CV — summary, detailed, or json</td></tr>
		<tr><td><code>duyet://blog/posts/{limit}</code></td><td>Latest blog posts</td></tr>
		<tr><td><code>duyet://projects/{limit}</code></td><td>Open source projects by stars (live)</td></tr>
		<tr><td><code>duyet://github-activity</code></td><td>Recent GitHub activity</td></tr>
		<tr><td><code>duyet://blog/llms.txt</code></td><td>Index of 296+ blog posts</td></tr>
	</table>

	<h2>Example conversation</h2>
	<div class="chat">
		<p><b>You:</b> Who is Duyet and what is he working on?</p>
		<p><b>Claude:</b> <em>[reads duyet://about and duyet://github-activity]</em> Duyet is a Sr. Data Engineer with 9+ years of experience… recently working on MCP servers and data tooling.</p>
		<p><b>You:</b> We're hiring — here's the JD: <em>(paste)</em></p>
		<p><b>Claude:</b> <em>[calls hire_me with the JD]</em> Sent! Duyet will receive your job description with a reference ID.</p>
	</div>

	<h2>Links</h2>
	<ul>
		<li><a href="/llms.txt">/llms.txt</a> — this page for agents (plain text)</li>
		<li><a href="/usage">/usage</a> — live usage telemetry</li>
		<li><a href="https://duyet.net">duyet.net</a> · <a href="https://blog.duyet.net">blog</a> · <a href="https://duyet.net/cv">cv</a></li>
		<li><a href="https://github.com/duyet">github.com/duyet</a> · <a href="https://x.com/_duyet">x.com/_duyet</a> · <a href="https://linkedin.com/in/duyet">linkedin</a></li>
	</ul>

	<hr>
	<footer>Open source: <a href="https://github.com/duyet/duyet-mcp-server">duyet/duyet-mcp-server</a> · Cloudflare Workers · stateless, no cookies, minimal telemetry (<a href="/usage">public</a>)</footer>
</body>
</html>`;
}
