/**
 * Specific tests to boost coverage for under-tested files
 */

import { registerGetAnalyticsTool } from "../tools/contact-analytics";
import { registerGitHubActivityResource } from "../resources/github-activity";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to create mock response
const createMockResponse = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  statusText: ok ? "OK" : "Not Found",
  json: jest.fn().mockResolvedValue(data),
});

// Mock database with working methods
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  execute: jest.fn(),
};

jest.mock("../database", () => ({
  getDb: jest.fn(() => mockDb),
}));

const createMockServer = () =>
  ({
    registerTool: jest.fn(),
    registerResource: jest.fn(),
  }) as any;

beforeEach(() => {
  jest.clearAllMocks();
  mockDb.execute.mockResolvedValue([]);
  (global.fetch as jest.Mock).mockClear();
});

describe("Coverage Boost Tests", () => {
  describe("Contact Analytics - All Branch Coverage", () => {
    test("should handle summary report with data", async () => {
      const mockServer = createMockServer();
      const mockEnv = {
        DB: {} as D1Database,
        MCP_OBJECT: {} as DurableObjectNamespace,
        ANALYTICS: {} as AnalyticsEngineDataset,
      } as unknown as Env;

      // Mock multiple return values for different queries
      mockDb.execute
        .mockResolvedValueOnce([
          { purpose: "collaboration", count: 5 },
          { purpose: "job_opportunity", count: 3 },
        ])
        .mockResolvedValueOnce([{ count: 10 }]);

      let toolHandler: any;
      (mockServer.registerTool as jest.Mock).mockImplementation(
        (name, _schema, handler) => {
          if (name === "get_analytics") toolHandler = handler;
        },
      );

      registerGetAnalyticsTool(mockServer as any, mockEnv as Env);
      const result = await toolHandler({ report_type: "summary" });

      expect(result.content[0].text).toBeDefined();
    });

    test("should handle purpose_breakdown report", async () => {
      const mockServer = createMockServer();
      const mockEnv = {
        DB: {} as D1Database,
        MCP_OBJECT: {} as DurableObjectNamespace,
        ANALYTICS: {} as AnalyticsEngineDataset,
      } as unknown as Env;

      mockDb.execute.mockResolvedValueOnce([
        { purpose: "collaboration", count: 8 },
        { purpose: "job_opportunity", count: 5 },
        { purpose: "consulting", count: 2 },
        { purpose: "general_inquiry", count: 1 },
      ]);

      let toolHandler: any;
      (mockServer.registerTool as jest.Mock).mockImplementation(
        (name, _schema, handler) => {
          if (name === "get_analytics") toolHandler = handler;
        },
      );

      registerGetAnalyticsTool(mockServer as any, mockEnv as Env);
      const result = await toolHandler({ report_type: "purpose_breakdown" });

      expect(result.content[0].text).toBeDefined();
    });

    test("should handle daily_trends report", async () => {
      const mockServer = createMockServer();
      const mockEnv = {
        DB: {} as D1Database,
        MCP_OBJECT: {} as DurableObjectNamespace,
        ANALYTICS: {} as AnalyticsEngineDataset,
      } as unknown as Env;

      mockDb.execute.mockResolvedValueOnce([
        { date: "2024-01-01", daily_total: 3 },
        { date: "2024-01-02", daily_total: 5 },
        { date: "2024-01-03", daily_total: 2 },
      ]);

      let toolHandler: any;
      (mockServer.registerTool as jest.Mock).mockImplementation(
        (name, _schema, handler) => {
          if (name === "get_analytics") toolHandler = handler;
        },
      );

      registerGetAnalyticsTool(mockServer as any, mockEnv as Env);
      const result = await toolHandler({ report_type: "daily_trends" });

      expect(result.content[0].text).toBeDefined();
    });

    test("should handle recent_activity report", async () => {
      const mockServer = createMockServer();
      const mockEnv = {
        DB: {} as D1Database,
        MCP_OBJECT: {} as DurableObjectNamespace,
        ANALYTICS: {} as AnalyticsEngineDataset,
      } as unknown as Env;

      mockDb.execute.mockResolvedValueOnce([
        { purpose: "collaboration", total: 3, last_submission: "1704067200" },
        { purpose: "job_opportunity", total: 2, last_submission: "1704153600" },
      ]);

      let toolHandler: any;
      (mockServer.registerTool as jest.Mock).mockImplementation(
        (name, _schema, handler) => {
          if (name === "get_analytics") toolHandler = handler;
        },
      );

      registerGetAnalyticsTool(mockServer as any, mockEnv as Env);
      const result = await toolHandler({ report_type: "recent_activity" });

      expect(result.content[0].text).toBeDefined();
    });

    test("should handle custom_period with valid dates", async () => {
      const mockServer = createMockServer();
      const mockEnv = {
        DB: {} as D1Database,
        MCP_OBJECT: {} as DurableObjectNamespace,
        ANALYTICS: {} as AnalyticsEngineDataset,
      } as unknown as Env;

      mockDb.execute.mockResolvedValueOnce([
        { purpose: "collaboration", count: 4 },
        { purpose: "consulting", count: 1 },
      ]);

      let toolHandler: any;
      (mockServer.registerTool as jest.Mock).mockImplementation(
        (name, _schema, handler) => {
          if (name === "get_analytics") toolHandler = handler;
        },
      );

      registerGetAnalyticsTool(mockServer as any, mockEnv as Env);
      const result = await toolHandler({
        report_type: "custom_period",
        date_from: "2024-01-01",
        date_to: "2024-01-31",
      });

      expect(result.content[0].text).toBeDefined();
    });

    test("should handle custom_period with invalid dates", async () => {
      const mockServer = createMockServer();
      const mockEnv = {
        DB: {} as D1Database,
        MCP_OBJECT: {} as DurableObjectNamespace,
        ANALYTICS: {} as AnalyticsEngineDataset,
      } as unknown as Env;

      let toolHandler: any;
      (mockServer.registerTool as jest.Mock).mockImplementation(
        (name, _schema, handler) => {
          if (name === "get_analytics") toolHandler = handler;
        },
      );

      registerGetAnalyticsTool(mockServer as any, mockEnv as Env);
      const result = await toolHandler({
        report_type: "custom_period",
        date_from: "invalid-date",
        date_to: "2024-01-31",
      });

      expect(result.content[0].text).toContain("Invalid date format");
    });
  });

  describe("GitHub Activity - Success Paths", () => {
    test("should handle successful GitHub response with commits", async () => {
      const mockServer = createMockServer();

      // Mock fetch response
      mockFetch.mockResolvedValue(
        createMockResponse([
          {
            type: "PushEvent",
            created_at: "2024-01-01T12:00:00Z",
            repo: { name: "duyet/test-repo" },
            payload: {
              commits: [{ message: "Add new feature" }, { message: "Fix bug" }],
            },
          },
          {
            type: "IssuesEvent",
            created_at: "2024-01-02T14:00:00Z",
            repo: { name: "duyet/another-repo" },
            payload: { action: "opened" },
          },
        ]),
      );

      let resourceHandler: any;
      (mockServer.registerResource as jest.Mock).mockImplementation(
        (name, _template, _metadata, handler) => {
          if (name === "github-activity") {
            resourceHandler = handler;
          }
        },
      );

      registerGitHubActivityResource(mockServer);
      const result = await resourceHandler(
        new URL("duyet://github/activity/10/true"),
        {
          limit: "10",
          include_details: "true",
        },
      );

      expect(result.contents[0].text).toContain("Recent GitHub Activity");
      expect(result.contents[0].text).toContain("Pushed 2 commits");
      expect(result.contents[0].text).toContain("Add new feature");
    });

    test("should handle GitHub response without details", async () => {
      const mockServer = createMockServer();

      // Mock fetch response
      mockFetch.mockResolvedValue(
        createMockResponse([
          {
            type: "CreateEvent",
            created_at: "2024-01-03T16:00:00Z",
            repo: { name: "duyet/new-project" },
            payload: { ref_type: "branch" },
          },
        ]),
      );

      let resourceHandler: any;
      (mockServer.registerResource as jest.Mock).mockImplementation(
        (name, _template, _metadata, handler) => {
          if (name === "github-activity") {
            resourceHandler = handler;
          }
        },
      );

      registerGitHubActivityResource(mockServer);
      const result = await resourceHandler(
        new URL("duyet://github/activity/5/false"),
        {
          limit: "5",
          include_details: "false",
        },
      );

      expect(result.contents[0].text).toContain("Recent GitHub Activity");
      expect(result.contents[0].text).toContain("Created branch");
    });

    test("should handle different event types", async () => {
      const mockServer = createMockServer();

      // Mock fetch response
      mockFetch.mockResolvedValue(
        createMockResponse([
          {
            type: "WatchEvent",
            created_at: "2024-01-04T18:00:00Z",
            repo: { name: "duyet/starred-repo" },
            payload: { action: "started" },
          },
          {
            type: "ForkEvent",
            created_at: "2024-01-05T20:00:00Z",
            repo: { name: "duyet/forked-repo" },
            payload: {},
          },
        ]),
      );

      let resourceHandler: any;
      (mockServer.registerResource as jest.Mock).mockImplementation(
        (name, _template, _metadata, handler) => {
          if (name === "github-activity") {
            resourceHandler = handler;
          }
        },
      );

      registerGitHubActivityResource(mockServer);
      const result = await resourceHandler(
        new URL("duyet://github/activity/2/true"),
        {
          limit: "2",
          include_details: "true",
        },
      );

      expect(result.contents[0].text).toContain("Recent GitHub Activity");
      expect(result.contents[0].text).toContain("Starred repository");
      expect(result.contents[0].text).toContain("Forked repository");
    });
  });
});
