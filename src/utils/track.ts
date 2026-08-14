/**
 * MCP client usage tracking.
 *
 * A single sink: raw per-request events inserted into ClickHouse over its HTTP
 * interface. ClickHouse replaced both earlier sinks, the Workers Analytics
 * Engine dataset and the D1 `usage_stats` daily rollups, so the dashboard now
 * aggregates raw events at query time instead of maintaining a rollup table.
 *
 * The write is fire-and-forget and never throws: the instance is self-hosted,
 * and it being unreachable must not affect the MCP endpoint.
 */

import { insertQuietly, isClickHouseConfigured } from "../clickhouse/client";
import { safeTableName } from "../clickhouse/usage-queries";
import { logger } from "./logger";

interface JsonRpcBody {
	method?: string;
	params?: {
		clientInfo?: { name?: string; version?: string };
		protocolVersion?: string;
		name?: string;
		uri?: string;
	};
}

interface TrackedRequest {
	method: string;
	clientName: string;
	clientVersion: string;
	toolName: string;
	resourceUri: string;
	protocolVersion: string;
	userAgent: string;
	country: string;
	city: string;
	asn: string;
	colo: string;
}

function extract(request: Request, body: unknown): TrackedRequest {
	const rpc = (body ?? {}) as JsonRpcBody;
	const method = typeof rpc.method === "string" ? rpc.method : "unknown";
	const cf = (
		request as { cf?: { country?: string; colo?: string; city?: string; asn?: number } }
	).cf;

	return {
		method,
		// Client identity is only present on "initialize"; tool name on "tools/call".
		clientName: rpc.params?.clientInfo?.name ?? "",
		clientVersion: rpc.params?.clientInfo?.version ?? "",
		toolName: method === "tools/call" ? (rpc.params?.name ?? "") : "",
		resourceUri: method === "resources/read" ? (rpc.params?.uri ?? "") : "",
		protocolVersion: rpc.params?.protocolVersion ?? "",
		userAgent: (request.headers.get("User-Agent") ?? "").slice(0, 256),
		country: cf?.country ?? "",
		city: cf?.city ?? "",
		asn: cf?.asn ? String(cf.asn) : "",
		colo: cf?.colo ?? "",
	};
}

/** Map the extracted request onto the ClickHouse column names. */
function toRow(t: TrackedRequest): Record<string, unknown> {
	return {
		// ClickHouse parses this DateTime64(3) format directly.
		timestamp: new Date().toISOString().replace("T", " ").replace("Z", ""),
		method: t.method,
		client_name: t.clientName,
		client_version: t.clientVersion,
		protocol_version: t.protocolVersion,
		tool_name: t.toolName,
		resource_uri: t.resourceUri,
		user_agent: t.userAgent,
		country: t.country,
		city: t.city,
		asn: t.asn,
		colo: t.colo,
	};
}

/**
 * Track an MCP request. Returns a promise for ctx.waitUntil so the insert never
 * blocks the response, and never throws.
 */
export function trackMcpRequest(env: Env, request: Request, body: unknown): Promise<void> {
	try {
		if (!isClickHouseConfigured(env)) return Promise.resolve();
		const row = toRow(extract(request, body));
		return insertQuietly(env, safeTableName(env.CLICKHOUSE_TABLE), [row]);
	} catch (error) {
		logger.warn("request", "Analytics tracking failed", {
			error: error instanceof Error ? error.message : String(error),
		});
		return Promise.resolve();
	}
}
