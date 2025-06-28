# duyet-mcp-server

An experimental MCP (Model Context Protocol) server that helps AI assistants connect to and retrieve information about duyet. This server provides access to information primarily available at [https://duyet.net](https://duyet.net), making it available directly to your AI assistant.

Update your Claude/Cursor/etc configuration to point to the URL of Duyet MCP server

```json
{
  "mcpServers": {
    "duyet-mcp-server": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://duyet-mcp-server.duyet.workers.dev/sse"
      ]
    }
  }
}
```


## About This Project

This is a **study, demo, and experimental project** designed to explore MCP capabilities. The project serves as a learning exercise in building remote MCP servers and is mostly written by LLM as well, showcasing AI-assisted development.

**Purpose**: Enable AI assistants to access and retrieve information about duyet's work, projects, and content that would otherwise require manual web browsing.

## Get Started

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
        "http://localhost:8787/sse"  // or duyet-mcp-server.your-account.workers.dev/sse
      ]
    }
  }
}
```

Restart Claude and you should see the duyet information tools become available.

## What This MCP Provides

Once connected, your AI assistant will have access to tools that can retrieve information about duyet's:
- Projects and work
- Blog posts and articles
- Technical expertise and experience
- And other content available on duyet.net

## Experimental Nature

⚠️ **Note**: This is an experimental project built for learning and demonstration purposes. The functionality may change as we explore different MCP patterns and capabilities.
