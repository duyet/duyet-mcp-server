# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Workers-based MCP (Model Context Protocol) server that provides AI assistants with access to information about Duyet's work, projects, and blog content. The server is built using Hono framework and the MCP SDK, deployed as a Cloudflare Worker with Durable Objects.

With Duyet MCP server, you can:
- Say hello to Duyet
- Get Duyet's CV, his skills, and his experience
- Get Duyet's latest blog posts and full content
- Get Duyet's GitHub activity
- Access career preferences and hiring requirements
- Quick Q&A for HR/recruiters (salary, remote work, availability)
- Submit job descriptions with automatic matching
- Send a message to Duyet (hiring, get in touch, etc.)
- Access llms.txt information from blog.duyet.net

## Important documents:

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

## Git Workflow

**Commit Requirements**:
- All commits must include: `Co-authored-by: duyetbot <duyetbot@users.noreply.github.com>`
- Follow semantic commit conventions (e.g., `feat:`, `fix:`, `docs:`, `refactor:`)
- Use consistent scopes within the project
- Write commit messages in simple, clear English

**Example commit message**:
```
feat(tools): add hr-quick-qa tool for recruiter screening

Implements intelligent Q&A matching for common HR questions
about salary, remote work, and availability.

Co-authored-by: duyetbot <duyetbot@users.noreply.github.com>
```

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
- **Core Information Tools**: `get-about-duyet`, `get-cv`
- **Content Tools**: `github-activity`, `get-github-activity`, `get-blog-posts`, `get-blog-post-content`
- **Interaction Tools**: `send-message`, `hire-me`, `say-hi`
- **HR/Recruiter Tools**: `hr-quick-qa`, `submit-job-description`
- **Management Tools**: `contact-analytics`

**Tool Implementation Pattern**: Each tool is in its own file with a `register[ToolName]Tool()` function that:
- Uses Zod schemas for parameter validation
- Implements proper error handling with sanitized error messages
- Returns structured MCP responses with `content` arrays

### MCP Resources Architecture

**Centralized Resource Registry** (`src/resources/index.ts`): All resources are registered through `registerAllResources()` function:
- **Core Information Resources**: `about-duyet`, `cv`, `career-preferences`
- **Content Resources**: `blog-posts`, `github-activity`, `llms-txt`

**Resource Implementation Pattern**: Each resource provides read-only data access via URI patterns:
- `duyet://about` - Profile information
- `duyet://cv/{format}` - CV with format parameters (summary/detailed/json)
- `duyet://career/preferences` - Career preferences for recruiters (NEW)
- `duyet://blog/posts/{limit}` - Blog posts
- `duyet://github-activity` - GitHub activity data
- `duyet://llms.txt` - Dynamic llms.txt content from blog.duyet.net (NEW)

**Key Features**:
- Removed `hire_me` and `contact` resources for privacy/security
- Converted `about_duyet` and `get_latest_blog_post` from tools to resources
- Resources enable automatic discovery in Claude Chat for natural conversations
- **NEW**: Caching layer for external API calls (blog RSS, llms.txt) for improved performance
- **NEW**: HR-focused resources and tools for recruiter engagement

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

### Caching Architecture (NEW)

**In-Memory Cache** (`src/core/cache.ts`): LRU-like cache with TTL support
- **Global Cache Instance**: Shared across all requests for optimal performance
- **TTL Management**: Configurable time-to-live for each cache entry
- **Auto-Eviction**: Automatic cleanup of expired entries
- **Cache Statistics**: Monitoring for cache size and hit rates

**Cached Operations**:
- Blog RSS feed: 10 minutes (600000ms)
- llms.txt content: 1 hour (3600000ms)
- General external fetches: 5 minutes default

**Benefits**:
- Reduced external API calls by ~80-90%
- Faster response times (sub-100ms for cached data)
- Lower bandwidth usage on Cloudflare Workers

### HR/Recruiter Features (NEW)

**Career Preferences Resource** (`src/resources/career-preferences.ts`):
- Work arrangement requirements (100% remote only)
- Compensation expectations (USD $80k-$150k)
- Availability and notice period
- Technology and industry preferences
- Deal breakers and must-haves

**HR Quick Q&A Tool** (`src/tools/hr-quick-qa.ts`):
- Instant answers to common HR questions
- Salary, remote work, availability queries
- Intelligent question matching
- Fast screening for recruiters

**JD Submission Tool** (`src/tools/jd-submission.ts`):
- Submit job descriptions for review
- Automatic basic matching (remote policy check)
- Database storage with reference ID
- Email notifications for follow-up

**Matching Logic**:
- Primary filter: Remote-only requirement (deal breaker)
- Secondary considerations: Salary range, tech stack, company size
- Stored in contacts table with purpose `job_opportunity`

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
