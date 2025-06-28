# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Workers-based MCP (Model Context Protocol) server that provides AI assistants with access to information about Duyet's work, projects, and blog content. The server is built using Hono framework and the MCP SDK, deployed as a Cloudflare Worker with Durable Objects.

With Duyet MCP server, you can:
- Say hello to Duyet
- Get Duyet's CV, his skills, and his experience
- Get Duyet's latest blog posts
- Get Duyet's GitHub activity
- Get Duyet's contact information
- Send a message to Duyet (hiring, get in touch, etc.)

## Important documents:

- Read @./docs/mcp.md
- Read @./docs/mcp-typescript-sdk.md

## Development Commands

- `npm run dev` - Start local development server with hot reloading
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run format` - Format code using Biome formatter
- `npm run lint:fix` - Fix linting issues using Biome
- `npm run type-check` - Run TypeScript type checking without emitting files
- `npm run cf-typegen` - Generate Cloudflare Worker types
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run all` - Run complete CI pipeline (lint, format, type-check, test with coverage, deploy)

## Architecture

### Core Components

**DuyetMCP Class** (`src/index.ts`): Main MCP agent that extends `McpAgent` from the agents library. Contains:
- MCP server configuration with name and version
- Tool registration via `registerAllTools()` from centralized tool registry

**Hono Application** (`src/index.ts`): HTTP server that provides:
- Root endpoint with usage instructions
- SSE endpoint for real-time MCP communication (`/sse`) - **recommended for browser connections**
- Standard MCP endpoint (`/mcp`) - WebSocket-based with CORS restrictions
- Favicon redirect to blog icon

### MCP Tools Architecture

**Centralized Tool Registry** (`src/tools/index.ts`): All tools are registered through `registerAllTools()` function, organized by category:
- **Core Information Tools**: `get-cv`
- **Content Tools**: `github-activity`
- **Interaction Tools**: `send-message`, `hire-me`, `say-hi`
- **Management Tools**: `contact-analytics`

**Tool Implementation Pattern**: Each tool is in its own file with a `register[ToolName]Tool()` function that:
- Uses Zod schemas for parameter validation
- Implements proper error handling with sanitized error messages
- Returns structured MCP responses with `content` arrays

### MCP Resources Architecture

**Centralized Resource Registry** (`src/resources/index.ts`): All resources are registered through `registerAllResources()` function:
- **Core Information Resources**: `about-duyet`, `cv`
- **Content Resources**: `blog-posts`, `github-activity`

**Resource Implementation Pattern**: Each resource provides read-only data access via URI patterns:
- `duyet://about` - Profile information (converted from about_duyet tool)
- `duyet://blog/posts/{limit}` - Blog posts (converted from get_latest_blog_post tool)
- `duyet://cv/{format}` - CV with format parameters
- `duyet://github-activity` - GitHub activity data

**Key Changes**: 
- Removed `hire_me` and `contact` resources for privacy/security
- Converted `about_duyet` and `get_latest_blog_post` from tools to resources
- Resources enable automatic discovery in Claude Chat for natural conversations

### Database Architecture

**Drizzle ORM with SQLite/D1**: 
- **Schema Definition** (`src/database/schema.ts`): Single source of truth for database structure
- **Database Connection** (`src/database/index.ts`): Centralized DB connection management
- **Security**: All queries use parameterized statements via Drizzle ORM to prevent SQL injection

**Contacts Table Structure**:
- Contact submissions with purpose categorization
- Reference ID system for tracking
- Timestamp tracking (created/updated)
- IP and user agent logging for analytics

### Cloudflare Workers Integration

- **Durable Objects**: Uses `DuyetMCP` class as a Durable Object for persistent connections
- **D1 Database**: SQLite database for contact storage (`duyet-mcp-contacts`)
- **Analytics Engine**: Contact analytics tracking (`contact_analytics` dataset)
- **Smart Placement**: Enabled for optimal geographic distribution
- **Observability**: Built-in monitoring enabled
- **Migrations**: Configured for class name changes (MyMCP → DuyetMCP)

## Key Dependencies

- `@modelcontextprotocol/sdk`: Core MCP functionality
- `agents`: MCP agent framework with `McpAgent` base class
- `hono`: Lightweight web framework for HTTP handling
- `drizzle-orm`: Type-safe database ORM
- `htmlparser2` & `domutils`: XML/HTML parsing for RSS feeds
- `zod`: Schema validation for tool parameters

## Configuration Files

- **wrangler.jsonc**: Cloudflare Workers configuration with Durable Objects, D1, and Analytics Engine setup
- **biome.json**: Code formatting and linting configuration (4-space indentation, 100 char line width)
- **tsconfig.json**: TypeScript configuration for ES2021 target with bundler module resolution
- **jest.config**: ESM-compatible Jest configuration for testing

## Development Patterns

### Adding New MCP Tools

1. Create tool file in `/src/tools/[tool-name].ts`:
```typescript
export function register[ToolName]Tool(server: McpServer, env?: Env) {
  server.registerTool("tool_name", {
    title: "Tool Title",
    description: "Tool description for AI assistants",
    inputSchema: {
      parameter: z.type().describe("description")
    }
  }, async ({ parameter }) => {
    try {
      // Tool implementation
      return {
        content: [{ type: "text", text: "result" }]
      };
    } catch (_error) {
      // Sanitized error handling
      return {
        content: [{ type: "text", text: "Error message without sensitive details" }]
      };
    }
  });
}
```

2. Register in `/src/tools/index.ts`:
   - Add import statement
   - Add to `registerAllTools()` function
   - Add to exports object

**Example**: The `send_message` tool (renamed from `contact`) demonstrates this pattern with database integration and proper error handling.

### Database Operations

**Always use Drizzle ORM** - never raw SQL:
```typescript
// ✅ Good - parameterized queries
await db.select().from(contacts).where(eq(contacts.id, userId));

// ❌ Bad - SQL injection risk
await db.run(`SELECT * FROM contacts WHERE id = ${userId}`);
```

**Error Handling**: Always sanitize database errors before returning to users.

### MCP Resources

Resources are also supported alongside tools. Add them in `/src/resources/` and register via `registerAllResources()`:
```typescript
export function register[ResourceName]Resource(server: McpServer, env?: Env) {
  server.registerResource("duyet://resource-uri", "Resource description", () => ({
    contents: [{ type: "text", text: "resource content" }]
  }));
}
```

### HTTP Endpoints

Use Hono's routing pattern:
```typescript
app.get("/endpoint", (c) => c.text("response"));
app.all("/sse/*", async (c) => {
  const mcpApp = DuyetMCP.serveSSE("/sse");
  return mcpApp.fetch(c.req.raw, c.env, c.executionCtx);
});
```

## Connection Endpoints

- **SSE Endpoint** (`/sse`): Recommended for browser-based connections, CORS-friendly
- **MCP Endpoint** (`/mcp`): WebSocket-based, may have CORS restrictions in browsers
- **Root Endpoint** (`/`): Provides connection instructions and configuration examples

## Testing

- **Jest Configuration**: ESM-compatible setup for TypeScript
- **Test Location**: All tests in `/src/tests/` directory
- **Coverage**: Configured to exclude test files and type definitions
- **Database Testing**: Uses in-memory SQLite for testing database operations
- **Connect via Cloudflare AI Playground**: https://playground.ai.cloudflare.com/ using deployed Worker URL

## Security Considerations

- All database queries use parameterized statements via Drizzle ORM
- Error messages are sanitized to prevent information leakage
- Input validation using Zod schemas on all tool parameters
- Contact form includes rate limiting considerations via reference ID system