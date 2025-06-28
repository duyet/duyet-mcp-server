# duyet-mcp-server

[![CI/CD Pipeline](https://github.com/duyet/duyet-mcp-server/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/duyet/duyet-mcp-server/actions)
[![codecov](https://codecov.io/gh/duyet/duyet-mcp-server/branch/master/graph/badge.svg)](https://codecov.io/gh/duyet/duyet-mcp-server)
[![Security](https://github.com/duyet/duyet-mcp-server/workflows/Security%20and%20Dependencies/badge.svg)](https://github.com/duyet/duyet-mcp-server/actions)

An experimental [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that helps AI assistants connect to and retrieve information about duyet. This server provides access to information primarily available at [https://duyet.net](https://duyet.net), making it available directly to your AI assistant.

Usage: Update MCP server configuration in your AI assistant:

```json
{
  "mcpServers": {
    "duyet-mcp-server": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp.duyet.net/sse"
      ]
    }
  }
}
```

If you are using Claude Code:

```bash
claude mcp add --transport http duyet https://mcp.duyet.net/mcp
```

Endpoints:
- https://mcp.duyet.net/sse
- https://mcp.duyet.net/mcp

![](./.github/screenshots/screenshot-1.png)
![](./.github/screenshots/screenshot-2.png)
![](./.github/screenshots/screenshot-3.png)
![](./.github/screenshots/screenshot-4.png)
![](./.github/screenshots/screenshot-5.png)
![](./.github/screenshots/screenshot-6.png)

## About This Project

This is a **study, demo, and experimental project** designed to explore MCP capabilities. The project serves as a learning exercise in building remote MCP servers and is mostly written by LLM as well.

**Purpose**: Enable AI assistants to access and retrieve information about duyet's work, projects, and content that would otherwise require manual web browsing.

## Deploy to Cloudflare Workers

[![Deploy to Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/duyet/duyet-mcp-server)

This will deploy your MCP server to a URL like: `duyet-mcp-server.<your-account>.workers.dev/sse`


Alternatively, you can clone and deploy using the command line:

```bash
git clone https://github.com/duyet/duyet-mcp-server
cd duyet-mcp-server
npm install
npm run deploy
```

## Customizing Your MCP Server

To add your own [tools](https://developers.cloudflare.com/agents/model-context-protocol/tools/) to the MCP server, define each tool inside the `init()` method of `src/index.ts` using `this.server.tool(...)`. 

### Connect to Cloudflare AI Playground

You can test your MCP server using the Cloudflare AI Playground:

1. Go to https://playground.ai.cloudflare.com/
2. Enter your deployed MCP server URL (`duyet-mcp-server.<your-account>.workers.dev/sse` or `duyet-mcp-server.<your-account>.workers.dev/mcp`)
3. You can now use the duyet information tools directly from the playground!

### Connect Claude Desktop to Your MCP Server

You can connect to your remote MCP server from Claude Desktop using the [mcp-remote proxy](https://www.npmjs.com/package/mcp-remote). 

To connect from Claude Desktop, follow [Anthropic's Quickstart](https://modelcontextprotocol.io/quickstart/user) and go to Settings > Developer > Edit Config.

Update with this configuration:

```json
{
  "mcpServers": {
    "duyet-info": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://duyet-mcp-server.<your-account>.workers.dev/sse"
      ]
    }
  }
}
```

You should see the duyet-mcp information tools become available.

# Available Resources and Tools

This MCP server exposes both **Resources** (read-only data access via URIs) and **Tools** (interactive functions with parameters).

## Resources
Resources provide read-only access to information through URI-based requests.

### Core Information Resources
- **`duyet://about`** - Basic information about Duyet with dynamically calculated years of experience
- **`duyet://cv/{format}`** - CV/resume with format parameters:
  - `duyet://cv/summary` - Brief CV overview
  - `duyet://cv/detailed` - Comprehensive CV information  
  - `duyet://cv/json` - Structured CV data (when available)

### Content Resources
- **Blog Posts Resource** - Latest blog post information from RSS feed
- **GitHub Activity Resource** - Recent GitHub contributions and activity
- **Hire Me Resource** - Professional hiring information with role matching
- **Contacts Resource** - Contact submission data (database-backed)

## Tools
Tools provide interactive functionality with input parameters and dynamic responses.

- **`about_duyet`** - Get basic information about Duyet, a Senior Data Engineer with extensive experience in data engineering, cloud technologies, and distributed systems
- **`get_cv`** - Retrieve Duyet's CV (curriculum vitae) in different formats - summary, detailed, or JSON format
- **`get_latest_blog_post`** - Fetch the latest blog posts from Duyet's technical blog at blog.duyet.net. Get up to 10 recent posts with titles, links, descriptions, and publication dates
- **`get_github_activity`** - Retrieve Duyet's recent GitHub activity including commits, issues, pull requests, releases, and other public events. View up to 20 recent activities with optional detailed information
- **`contact`** - Send a message to Duyet for collaboration, job opportunities, consulting, or general inquiries. Messages are saved with a reference ID for follow-up
- **`hire_me`** - Get information about hiring Duyet for various roles - full-time, contract, consulting, or part-time positions. Includes expertise, experience, and next steps
- **`say_hi`** - Send a friendly greeting to Duyet with an optional personal message. Get contact information and connection links
- **`get_contacts`** - Retrieve and search contact submissions with filtering options by purpose, date range, email, or reference ID. Supports pagination for large result sets
- **`contact_analytics`** - Generate analytics reports on contact submissions including summary statistics, purpose breakdown, daily trends, and recent activity patterns


## Architecture

- **Framework**: Hono.js running on Cloudflare Workers
- **Database**: Cloudflare D1 with Drizzle ORM
- **Testing**: Jest with comprehensive test coverage
- **Linting**: Biome for code quality
- **Type Safety**: TypeScript with strict configuration

## License

MIT License - see LICENSE file for details.
