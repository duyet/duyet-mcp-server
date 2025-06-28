# duyet-mcp-server

[![CI/CD Pipeline](https://github.com/duyet/duyet-mcp-server/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/duyet/duyet-mcp-server/actions)
[![codecov](https://codecov.io/gh/duyet/duyet-mcp-server/branch/master/graph/badge.svg)](https://codecov.io/gh/duyet/duyet-mcp-server)
[![Security](https://github.com/duyet/duyet-mcp-server/workflows/Security%20and%20Dependencies/badge.svg)](https://github.com/duyet/duyet-mcp-server/actions)

An experimental MCP (Model Context Protocol) server that helps AI assistants connect to and retrieve information about duyet. This server provides access to information primarily available at [https://duyet.net](https://duyet.net), making it available directly to your AI assistant.

Update your Claude/Cursor/etc configuration to point to the URL of Duyet MCP server

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

Endpoints:
- https://mcp.duyet.net/sse
- https://mcp.duyet.net/mcp


## About This Project

This is a **study, demo, and experimental project** designed to explore MCP capabilities. The project serves as a learning exercise in building remote MCP servers and is mostly written by LLM as well, showcasing AI-assisted development.

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

## Connect to Cloudflare AI Playground

You can test your MCP server using the Cloudflare AI Playground:

1. Go to https://playground.ai.cloudflare.com/
2. Enter your deployed MCP server URL (`duyet-mcp-server.<your-account>.workers.dev/sse` or `duyet-mcp-server.<your-account>.workers.dev/mcp`)
3. You can now use the duyet information tools directly from the playground!

## Connect Claude Desktop to Your MCP Server

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
        "https://mcp.duyet.net/sse"
      ]
    }
  }
}
```

You should see the duyet-mcp information tools become available.

# Available Tools

### Contact Tools
- `contact`: Submit a contact form
- `get_contacts`: Retrieve contact submissions with filtering
- `contact_analytics`: Generate analytics reports on contacts

### Personal Information
- `about_duyet`: Get personal information about duyet
- `get_cv`: Retrieve CV/resume information
- `hire_me`: Information about hiring duyet

### Content Tools
- `get_latest_blog_post`: Fetch recent blog posts
- `get_github_activity`: View GitHub contributions and activity
- `say_hi`: Simple greeting tool

## Architecture

- **Framework**: Hono.js running on Cloudflare Workers
- **Database**: Cloudflare D1 with Drizzle ORM
- **Testing**: Jest with comprehensive test coverage
- **Linting**: Biome for code quality
- **Type Safety**: TypeScript with strict configuration

## License

MIT License - see LICENSE file for details.
