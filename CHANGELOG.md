# Changelog

All notable changes to this project are documented here. From v0.2.0 onward,
entries are generated automatically by [release-please](https://github.com/googleapis/release-please)
from conventional commits.

## 0.2.0 (2026-07-19)

### Features

* stateless Streamable HTTP MCP server — removed Durable Objects entirely (zero DO billing); `/sse` retired (410 Gone)
* client analytics: per-request events to Analytics Engine + permanent daily rollups in D1 `usage_stats` (client, version, method, tool, resource, country, approx unique users)
* `/usage` — public telemetry dashboard (requests/day, by client, method, tool, resource, country)
* landing page at `/` — black & white intro with connect guide, tools/resources tables, example conversation
* `duyet://projects/{limit}` resource — open source projects live from GitHub, sorted by stars
* richer `duyet://about` — skills, open-to-work (Data Engineering + AI agents), X/LinkedIn/email
* `hire_me` captures pasted job descriptions (up to 5000 chars), company and contact name
* `hire_me`/`send_message` forwarded to Telegram + email when secrets configured
* dynamic promo footers built from live blog/projects data
* multi-client connect docs (Claude Code/Desktop, Cursor, Windsurf, VS Code, Codex, Gemini CLI, Zed, mcp-remote)

### Performance

* Cache API for all external fetches (CV, blog, GitHub) with per-source TTLs
* log volume cut (info-level default, per-request registration logs demoted) to reduce Workers Logs events
* `llms.txt` served with edge caching

### CI

* deploy from GitHub Actions via `wrangler deploy` (no Cloudflare Workers Builds minutes)
* release-please for changelog and version tracking

## 0.1.0 (2025-06 – 2026-06)

### Features

* initial MCP server on Cloudflare Workers (Hono + `agents` McpAgent + Durable Objects)
* tools: `github_activity`, `get_blog_post_content`, `send_message`, `hire_me`, `say_hi`, `get_analytics`
* resources: `duyet://about`, `duyet://cv/{format}`, `duyet://blog/posts/{limit}`, `duyet://github-activity`, `duyet://blog/llms.txt`
* MCP prompts, tool annotations, structured output, client log forwarding
* D1 contact storage with Drizzle ORM, rate limiting, sanitized errors
* migrated runtime to Bun; structured logging utility
* removed web-search/web-fetch tools; performance and security hardening
