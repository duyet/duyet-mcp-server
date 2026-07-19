# Changelog

All notable changes to this project are documented here. From v0.2.0 onward,
entries are generated automatically by [release-please](https://github.com/googleapis/release-please)
from conventional commits.

## [0.2.1](https://github.com/duyet/duyet-mcp-server/compare/v0.2.0...v0.2.1) (2026-07-19)


### Features

* /usage telemetry dashboard with resource-level analytics ([a07dac5](https://github.com/duyet/duyet-mcp-server/commit/a07dac5bda30bef2e317ae589070e0e8ca826d8a))
* add basic information tools ([d22186c](https://github.com/duyet/duyet-mcp-server/commit/d22186c97e20121854541b3b8f3991765e5cdc37))
* add contact analytics dashboard ([5471bd9](https://github.com/duyet/duyet-mcp-server/commit/5471bd9c1d0ca69d223085bce51439427d2f3905))
* add contact management tools ([5f50ce1](https://github.com/duyet/duyet-mcp-server/commit/5f50ce1c06ff0f775a3d551a4792e1cc78d6681c))
* add database layer with contacts table ([b3bd6de](https://github.com/duyet/duyet-mcp-server/commit/b3bd6dee1d7094d72f38a632fc6c592aef243f3e))
* add MCP prompts, tool annotations, structured output, and client log forwarding ([97934c2](https://github.com/duyet/duyet-mcp-server/commit/97934c2ad9e62e8a64d7b154c17a43b149b3aebe))
* add say-hi greeting tool ([2093c01](https://github.com/duyet/duyet-mcp-server/commit/2093c019c4ff83f48f30a7ebfb5ba0a498c66978))
* add structured logging utility ([05a2826](https://github.com/duyet/duyet-mcp-server/commit/05a28261fce4db295d27fe1f60a8d1d1e18aeb63))
* black & white landing page at root with connect guide, tools, example chat ([791337d](https://github.com/duyet/duyet-mcp-server/commit/791337dda4981148c70f9ab5995762cfa5362001))
* client analytics (AE + D1 rollups), projects resource, richer profile, JD capture, notifications, multi-client docs ([4d3cab2](https://github.com/duyet/duyet-mcp-server/commit/4d3cab2983077e400e9d7b4be5be81ab9c464358))
* convert GitHub activity from resource to tool and enhance hire-me with database ([ca5995b](https://github.com/duyet/duyet-mcp-server/commit/ca5995bf231b037b27cb8bc8a69611ea88bc6bbd))
* enhance MCP server functionality and update resources ([190f060](https://github.com/duyet/duyet-mcp-server/commit/190f060ec0079cd92b16fb45df3d2d66b4e5435b))
* enhance MCP server with new resources and tools ([a55600b](https://github.com/duyet/duyet-mcp-server/commit/a55600b7ab8f8b8ad629c12913ba3c76d8eade5b))
* major performance and security enhancements ([#43](https://github.com/duyet/duyet-mcp-server/issues/43)) ([45b1988](https://github.com/duyet/duyet-mcp-server/commit/45b1988cc115058b232fb45c4dae699c84546217))
* migrate project to Bun runtime ([#50](https://github.com/duyet/duyet-mcp-server/issues/50)) ([06cbccc](https://github.com/duyet/duyet-mcp-server/commit/06cbcccc7109ae1a986f9264f9eb4582c7ec1597))
* refactor MCP and add web search ([#40](https://github.com/duyet/duyet-mcp-server/issues/40)) ([c7c7757](https://github.com/duyet/duyet-mcp-server/commit/c7c7757c7f674369c4a12c527b3a97bc013dabf9))
* replace direct GitHub API calls with Octokit SDK ([61a5bf2](https://github.com/duyet/duyet-mcp-server/commit/61a5bf260c0115d73d89478314feea74fb2ed93e))
* **resources:** add llms.txt blog resource with .md URL conversion ([5f484f6](https://github.com/duyet/duyet-mcp-server/commit/5f484f64f322486bbefd29d3f23cad2be6df9645))


### Bug Fixes

* **deps:** override @modelcontextprotocol/sdk to 1.26.0 globally to resolve typescript mismatch ([18a8fae](https://github.com/duyet/duyet-mcp-server/commit/18a8fae2dac3890799dfdd2197d376f491bdf401))
* **deps:** pin @modelcontextprotocol/sdk to 1.25.2 to resolve typescript mismatch ([e0e95d5](https://github.com/duyet/duyet-mcp-server/commit/e0e95d5fd9f7545668e9cc1b7e590637e28a5ceb))
* **deps:** update all non-major dependencies ([e48da7e](https://github.com/duyet/duyet-mcp-server/commit/e48da7e5f54a0ba0cebe232faeb09687185b5cbc))
* **deps:** update all non-major dependencies ([194b833](https://github.com/duyet/duyet-mcp-server/commit/194b833776183420619879fc25ada36eacaba75e))
* **deps:** update all non-major dependencies ([#32](https://github.com/duyet/duyet-mcp-server/issues/32)) ([589a54c](https://github.com/duyet/duyet-mcp-server/commit/589a54c2aa606e5e7c8e7d68274001f733d2aa2f))
* **deps:** update all non-major dependencies ([#44](https://github.com/duyet/duyet-mcp-server/issues/44)) ([86b126e](https://github.com/duyet/duyet-mcp-server/commit/86b126e7f53802343bf4a923d4004428705d6260))
* **deps:** update all non-major dependencies ([#65](https://github.com/duyet/duyet-mcp-server/issues/65)) ([ff757d5](https://github.com/duyet/duyet-mcp-server/commit/ff757d5be20755044984928b3eafc767d8dbb0ff))
* **deps:** update dependency @modelcontextprotocol/sdk to v1.13.2 ([1f6a3dc](https://github.com/duyet/duyet-mcp-server/commit/1f6a3dc032016646e0f1c0e05627e6eb53f70bbe))
* **deps:** update dependency @modelcontextprotocol/sdk to v1.13.2 ([cc197f6](https://github.com/duyet/duyet-mcp-server/commit/cc197f6cc22ff9bb16e79aac092b6ed567fc7a27))
* **deps:** update dependency @modelcontextprotocol/sdk to v1.15.1 ([b8299a3](https://github.com/duyet/duyet-mcp-server/commit/b8299a36e44095e87a2541472f404b01a97613f1))
* **deps:** update dependency @modelcontextprotocol/sdk to v1.26.0 [security] ([f9b008f](https://github.com/duyet/duyet-mcp-server/commit/f9b008fc89729d1cac28b49da6c62721d329a707))
* **deps:** update dependency agents to ^0.0.103 ([f05642e](https://github.com/duyet/duyet-mcp-server/commit/f05642e7f84df9e3e4e36005e29e177c76d4141d))
* **deps:** update dependency agents to ^0.0.99 ([57024c8](https://github.com/duyet/duyet-mcp-server/commit/57024c832752b390dacf46d71b64a079dfc00e26))
* **deps:** update dependency agents to ^0.0.99 ([77f200b](https://github.com/duyet/duyet-mcp-server/commit/77f200b02bfff060146a6a1908169238686ee3f5))
* **deps:** update dependency agents to v0.17.3 ([#67](https://github.com/duyet/duyet-mcp-server/issues/67)) ([2fb4316](https://github.com/duyet/duyet-mcp-server/commit/2fb4316f4e9da2206d57d1a4b544b64631b20c24))
* **deps:** update dependency agents to v0.3.10 [security] ([0109f7d](https://github.com/duyet/duyet-mcp-server/commit/0109f7df9dc4379aaf42baaa334b69378c8ce23d))
* **deps:** update dependency agents to v0.3.10 [security] ([2308c2b](https://github.com/duyet/duyet-mcp-server/commit/2308c2b850057f2bf12cd91ed82c92c0625bf630))
* **deps:** update dependency domutils to v4 ([5713a66](https://github.com/duyet/duyet-mcp-server/commit/5713a6623d0223a04286bed056e0b4da436637ad))
* **deps:** update dependency domutils to v4 ([d61977b](https://github.com/duyet/duyet-mcp-server/commit/d61977b9f577286963fd73884eebfa550221f328))
* **deps:** update dependency drizzle-orm to ^0.45.2 [security] ([709eb8e](https://github.com/duyet/duyet-mcp-server/commit/709eb8ea80a0f8e55580eafeebe87519173dfd86))
* **deps:** update dependency drizzle-orm to ^0.45.2 [security] ([e1ab3d2](https://github.com/duyet/duyet-mcp-server/commit/e1ab3d2786998f1bf0d75cf56251d7471940d676))
* **deps:** update dependency hono to v4.9.6 [security] ([#27](https://github.com/duyet/duyet-mcp-server/issues/27)) ([fb59dc1](https://github.com/duyet/duyet-mcp-server/commit/fb59dc10277d0c30b19f47c2ccf46c5e32a41524))
* **deps:** update dependency hono to v4.9.7 [security] ([#30](https://github.com/duyet/duyet-mcp-server/issues/30)) ([f21118e](https://github.com/duyet/duyet-mcp-server/commit/f21118e72bbb02bd1595615d2c189d9b3ab9fb39))
* **deps:** update dependency htmlparser2 to v12 ([5c68068](https://github.com/duyet/duyet-mcp-server/commit/5c68068462af8ecc88e36895de50a39de7647fbc))
* **deps:** update dependency htmlparser2 to v12 ([af97468](https://github.com/duyet/duyet-mcp-server/commit/af974683c886b37fd972146da9dde2b135909be5))
* **deps:** update dependency zod to v3.25.76 ([47ae3a3](https://github.com/duyet/duyet-mcp-server/commit/47ae3a3a8fe2897d133b4b3804e2047ce73072b3))
* resolve failing tests in coverage test files ([2fda2fb](https://github.com/duyet/duyet-mcp-server/commit/2fda2fba0a93c66994716401948bc6a89dc552da))
* restore compatible agents version and jest config ([34e0f25](https://github.com/duyet/duyet-mcp-server/commit/34e0f25c8a8e186768aad5c0688ce62c2f98a15a))
* update non-major dependencies with agents compatibility fix ([aee07ee](https://github.com/duyet/duyet-mcp-server/commit/aee07ee2ba7f24d0d49626143ba18c06fb263c57))
* update non-major dependencies with TypeScript compatibility fixes ([7ef048f](https://github.com/duyet/duyet-mcp-server/commit/7ef048f1e797a94ccc0dfcb58c341963cee86508))


### Performance

* cut log volume and cache llms.txt; docs: conversation tables in README ([86aa12e](https://github.com/duyet/duyet-mcp-server/commit/86aa12e25de6a0ad5508bf3766c6ec2184bf134f))
* remove @octokit/rest dependency and optimize caching ([7f4fe3c](https://github.com/duyet/duyet-mcp-server/commit/7f4fe3ca8a497f0bb06dd967793440ba4fed9891))


### Refactoring

* clean up code formatting and enhance tool registration ([ca69907](https://github.com/duyet/duyet-mcp-server/commit/ca699072e2b37ef811d2312d48093d34977ff417))
* create unified core logic layer and add get_ tools for resource compatibility ([6b813ae](https://github.com/duyet/duyet-mcp-server/commit/6b813aeee26c496e0a8c21bde9269b75286a64b7))
* organize tools with central registry ([e296e1f](https://github.com/duyet/duyet-mcp-server/commit/e296e1f065f83919dd9fa5135324cc611da261a7))
* remove Durable Objects, serve MCP as stateless Streamable HTTP ([b4fe346](https://github.com/duyet/duyet-mcp-server/commit/b4fe3465ed78c6d9b242e0d4480ee98e8ec0b1c5))
* **tools:** remove web-search and web-fetch tools ([87f5e1a](https://github.com/duyet/duyet-mcp-server/commit/87f5e1a3efc31ed9c251fc3e9e8541914556cab1))
* update tool registration method across tests and implementations ([d7c8321](https://github.com/duyet/duyet-mcp-server/commit/d7c83214771d0b86c1b083a4c8867611d59132e1))


### Documentation

* add development guide and documentation ([60eb967](https://github.com/duyet/duyet-mcp-server/commit/60eb9679c26cb96c34b68e8b7ac5c569852a7723))
* backfill CHANGELOG.md for 0.1.x and 0.2.0 ([32cd342](https://github.com/duyet/duyet-mcp-server/commit/32cd342f0aedf65d9e9c5472e950f8abf4414923))
* **endpoint:** enhance /llms.txt with complete resources and tools listing ([ef31f18](https://github.com/duyet/duyet-mcp-server/commit/ef31f181943603ca98c31258bc5fe16c68805ca9))
* remove MCP SDK documentation files ([cd7244e](https://github.com/duyet/duyet-mcp-server/commit/cd7244eceee2fc2e16c9c845aef5c4366e21453b))
* update README.md to enhance usage instructions and clarify available resources and tools ([27cf7e5](https://github.com/duyet/duyet-mcp-server/commit/27cf7e50566308a38b446cd3d612e92ec005a027))


### CI

* add GitHub Actions workflows for CI/CD ([6d62a6e](https://github.com/duyet/duyet-mcp-server/commit/6d62a6e2d56a93037a805e7987961afc765ee141))
* add release-please for changelog and version tracking ([3e9e686](https://github.com/duyet/duyet-mcp-server/commit/3e9e686dd7c473ff73c83128d956a30449490d58))
* deploy from GitHub Actions with wrangler instead of Workers Builds ([ca071f7](https://github.com/duyet/duyet-mcp-server/commit/ca071f74b5c8ebc1e7cbe8a2a35449c664b3c9d6))
* release-please manifest config with pre-1.0 patch bumps ([2ab6dad](https://github.com/duyet/duyet-mcp-server/commit/2ab6dad52b0da088cf6d6fa9d1cb5220117fc58c))
* remove deploy job from CI workflow ([253d524](https://github.com/duyet/duyet-mcp-server/commit/253d52485809663217c2dd0956c9535248a71756))

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
