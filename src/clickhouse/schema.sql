-- Schema for the MCP usage analytics table.
-- Run this once against the home ClickHouse instance:
--   clickhouse-client --database mcp < src/clickhouse/schema.sql
--
-- This table replaces both previous sinks: the Workers Analytics Engine dataset
-- (rich per-request events) and the D1 usage_stats daily rollups. ClickHouse
-- stores raw events and the dashboard aggregates at query time, so no rollup
-- table is needed.

CREATE TABLE IF NOT EXISTS mcp_requests
(
    -- Event time. The Worker sends this explicitly so retries cannot drift.
    timestamp        DateTime64(3, 'UTC'),
    date             Date MATERIALIZED toDate(timestamp),

    -- JSON-RPC method, e.g. initialize, tools/list, tools/call.
    method           LowCardinality(String),

    -- Client identity is only present on the initialize call.
    client_name      LowCardinality(String),
    client_version   LowCardinality(String),
    protocol_version LowCardinality(String),

    -- Populated only for tools/call and resources/read respectively.
    tool_name        LowCardinality(String),
    resource_uri     String,

    user_agent       String,

    -- Cloudflare request metadata.
    country          LowCardinality(String),
    city             String,
    asn              String,
    colo             LowCardinality(String),

    -- Non-cryptographic FNV-1a hash of the client IP, for approximate unique
    -- counting. Not reversible to an address, and no raw IP is ever stored.
    ip_hash          String
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (date, method, client_name)
-- Raw events are small; two years is far more history than the dashboard shows.
TTL toDateTime(date) + INTERVAL 2 YEAR;
