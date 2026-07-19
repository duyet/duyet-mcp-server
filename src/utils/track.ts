/**
 * MCP client usage tracking.
 *
 * Two sinks, both fire-and-forget:
 * - Workers Analytics Engine: rich per-request events (client, method, tool,
 *   user agent, country, colo, hashed IP for approximate uniques). Retained ~90 days.
 * - D1 `usage_stats`: daily rollup rows (date/client/method/tool/country + count),
 *   kept forever for long-term trends. One upsert per request.
 *
 * Query AE with the SQL API, e.g.:
 *   SELECT blob2 AS client, COUNT() AS requests, COUNT(DISTINCT blob7) AS approx_users
 *   FROM contact_analytics WHERE timestamp > NOW() - INTERVAL '7' DAY GROUP BY client
 */

import { sql } from "drizzle-orm";
import { getDb } from "../database";
import { usageStats } from "../database/schema";
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
	ipHash: string;
}

/** Non-cryptographic hash for approximate unique-user counting. Not reversible to an IP. */
function fnv1a(input: string): string {
	let hash = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return (hash >>> 0).toString(16);
}

function extract(request: Request, body: unknown): TrackedRequest {
	const rpc = (body ?? {}) as JsonRpcBody;
	const method = typeof rpc.method === "string" ? rpc.method : "unknown";
	const cf = (
		request as { cf?: { country?: string; colo?: string; city?: string; asn?: number } }
	).cf;
	const ip = request.headers.get("CF-Connecting-IP") ?? "";

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
		ipHash: ip ? fnv1a(ip) : "",
	};
}

/** Synchronous, non-blocking Analytics Engine write. */
function trackToAnalyticsEngine(env: Env, t: TrackedRequest): void {
	env.ANALYTICS?.writeDataPoint({
		blobs: [
			t.method, // blob1
			t.clientName, // blob2
			t.clientVersion, // blob3
			t.toolName, // blob4
			t.userAgent, // blob5
			t.country, // blob6
			t.ipHash, // blob7: approximate unique users
			t.colo, // blob8
			t.resourceUri, // blob9
			t.protocolVersion, // blob10
			t.city, // blob11
			t.asn, // blob12
		],
		doubles: [1],
		indexes: [t.clientName || t.userAgent.slice(0, 32) || "unknown"],
	});
}

/** Upsert the daily rollup row in D1 (long-term storage). */
async function trackToD1(env: Env, t: TrackedRequest): Promise<void> {
	const db = getDb(env.DB);
	const date = new Date().toISOString().slice(0, 10);

	await db
		.insert(usageStats)
		.values({
			date,
			client: t.clientName,
			clientVersion: t.clientVersion,
			method: t.method,
			tool: t.toolName,
			resource: t.resourceUri,
			country: t.country,
			count: 1,
		})
		.onConflictDoUpdate({
			target: [
				usageStats.date,
				usageStats.client,
				usageStats.clientVersion,
				usageStats.method,
				usageStats.tool,
				usageStats.resource,
				usageStats.country,
			],
			set: { count: sql`${usageStats.count} + 1` },
		});
}

/**
 * Track an MCP request. AE write is synchronous; the D1 upsert is returned as a
 * promise for ctx.waitUntil so it never blocks the response. Never throws.
 */
export function trackMcpRequest(env: Env, request: Request, body: unknown): Promise<void> {
	try {
		const t = extract(request, body);
		trackToAnalyticsEngine(env, t);
		return trackToD1(env, t).catch((error) => {
			logger.warn("database", "Usage rollup upsert failed", {
				error: error instanceof Error ? error.message : String(error),
			});
		});
	} catch (error) {
		logger.warn("request", "Analytics tracking failed", {
			error: error instanceof Error ? error.message : String(error),
		});
		return Promise.resolve();
	}
}
