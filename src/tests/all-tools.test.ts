import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerHireMeTool } from "../tools/hire-me";
import { registerSayHiTool } from "../tools/say-hi";
import { registerSendMessageTool } from "../tools/send-message";
import { registerGetAnalyticsTool } from "../tools/contact-analytics";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { registerAllTools } from "../tools/index";

// Mock the McpServer
const mockServer = {
  registerTool: jest.fn(),
} as unknown as McpServer;

// Mock environment
const mockEnv = {
  DB: {} as D1Database,
  MCP_OBJECT: {} as DurableObjectNamespace,
  ANALYTICS: {} as AnalyticsEngineDataset,
} as unknown as Env;

describe("Tool Registration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        "<title>Duyet - Senior Data Engineer</title><body>CV content</body>",
    });
  });

  describe("Send Message Tool", () => {
    test("should register send_message tool", () => {
      registerSendMessageTool(mockServer, mockEnv);
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "send_message",
        expect.any(Object),
        expect.any(Function),
      );
    });
  });

  describe("Hire Me Tool", () => {
    test("should register hire-me tool", () => {
      registerHireMeTool(mockServer, mockEnv);
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "hire_me",
        expect.any(Object),
        expect.any(Function),
      );
    });

    test("should handle hire-me tool with all parameters", async () => {
      let toolHandler: any;
      (mockServer.registerTool as jest.Mock).mockImplementation(
        (name, _config, handler) => {
          if (name === "hire_me") {
            toolHandler = handler;
          }
        },
      );

      registerHireMeTool(mockServer, mockEnv);
      const result = await toolHandler({
        role_type: "full_time",
        company_size: "startup",
        tech_stack: "React, Node.js, TypeScript",
      });
      expect(result.content[0].text).toContain("Hire Duyet");
      expect(result.content[0].text).toContain("Full-time");
      expect(result.content[0].text).toContain("fast-paced");
    });

    test("should handle hire-me tool with minimal parameters", async () => {
      let toolHandler: any;
      (mockServer.registerTool as jest.Mock).mockImplementation(
        (name, _config, handler) => {
          if (name === "hire_me") {
            toolHandler = handler;
          }
        },
      );

      registerHireMeTool(mockServer, mockEnv);
      const result = await toolHandler({});
      expect(result.content[0].text).toContain("Hire Duyet");
    });
  });

  describe("Say Hi Tool", () => {
    test("should register say-hi tool", () => {
      registerSayHiTool(mockServer);
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "say_hi",
        expect.any(Object),
        expect.any(Function),
      );
    });

    test("should handle say-hi tool without message", async () => {
      let toolHandler: any;
      (mockServer.registerTool as jest.Mock).mockImplementation(
        (name, _config, handler) => {
          if (name === "say_hi") {
            toolHandler = handler;
          }
        },
      );

      registerSayHiTool(mockServer);
      const result = await toolHandler({});
      expect(result.content[0].text).toContain("Hi Duyet!");
      expect(result.content[0].text).toContain("me@duyet.net");
    });

    test("should handle say-hi tool with custom message", async () => {
      let toolHandler: any;
      (mockServer.registerTool as jest.Mock).mockImplementation(
        (name, _config, handler) => {
          if (name === "say_hi") {
            toolHandler = handler;
          }
        },
      );

      registerSayHiTool(mockServer);
      const result = await toolHandler({ message: "How are you today?" });
      expect(result.content[0].text).toContain("Hi Duyet! How are you today?");
      expect(result.content[0].text).toContain("me@duyet.net");
    });
  });

  describe("Contact Analytics Tool", () => {
    test("should register get_analytics tool", () => {
      registerGetAnalyticsTool(mockServer, mockEnv);
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "get_analytics",
        expect.any(Object),
        expect.any(Function),
      );
    });
  });

  describe("Tool Registry", () => {
    test("should register all tools", () => {
      registerAllTools(mockServer, mockEnv);
      // Should have called tool registration for all 8 tools
      // Content: github_activity, get_blog_post_content
      // Web: web-search, web-fetch
      // Interaction: send_message, hire_me, say_hi
      // Management: get_analytics
      expect(mockServer.registerTool).toHaveBeenCalledTimes(8);
    });
  });
});
