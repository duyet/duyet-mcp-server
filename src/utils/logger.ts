/**
 * Debug logging utility for MCP server
 *
 * Provides structured logging with levels and categories.
 * All debug logs can be enabled/disabled via environment.
 * Optionally forwards logs to connected MCP clients via sendLoggingMessage.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogCategory =
	| "init"
	| "request"
	| "tool"
	| "resource"
	| "cache"
	| "fetch"
	| "database"
	| "auth";

/** Maps our log levels to MCP logging levels */
const MCP_LEVEL_MAP: Record<LogLevel, "debug" | "info" | "warning" | "error"> = {
	debug: "debug",
	info: "info",
	warn: "warning",
	error: "error",
};

interface LogEntry {
	timestamp: string;
	level: LogLevel;
	category: LogCategory;
	message: string;
	data?: Record<string, unknown>;
}

/**
 * Logger class for structured debug logging
 */
class Logger {
	private enabled = true;
	// Default to "info": with Workers observability enabled, every console line
	// is a billable log event, and debug logs fire on every request.
	private minLevel: LogLevel = "info";
	private mcpServer: McpServer | null = null;

	private levelPriority: Record<LogLevel, number> = {
		debug: 0,
		info: 1,
		warn: 2,
		error: 3,
	};

	/**
	 * Attach an MCP server instance to forward logs to connected clients.
	 * Only info/warn/error levels are forwarded to avoid flooding the client.
	 */
	setMcpServer(server: McpServer): void {
		this.mcpServer = server;
	}

	/**
	 * Check if logging should occur for given level
	 */
	private shouldLog(level: LogLevel): boolean {
		if (!this.enabled) return false;
		return this.levelPriority[level] >= this.levelPriority[this.minLevel];
	}

	/**
	 * Format log entry for output
	 */
	private formatLog(entry: LogEntry): string {
		const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
		return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}${dataStr}`;
	}

	/**
	 * Forward a log message to connected MCP clients.
	 * Only forwards info+ levels. Silently ignores failures.
	 */
	private sendToMcpClient(level: LogLevel, category: LogCategory, message: string): void {
		if (!this.mcpServer || this.levelPriority[level] < this.levelPriority.info) return;

		this.mcpServer
			.sendLoggingMessage({
				level: MCP_LEVEL_MAP[level],
				logger: `duyet-mcp/${category}`,
				data: message,
			})
			.catch(() => {
				// Silent failure — client may not support logging
			});
	}

	/**
	 * Core logging method
	 */
	private log(
		level: LogLevel,
		category: LogCategory,
		message: string,
		data?: Record<string, unknown>,
	): void {
		if (!this.shouldLog(level)) return;

		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			category,
			message,
			data,
		};

		const formatted = this.formatLog(entry);

		switch (level) {
			case "error":
				console.error(formatted);
				break;
			case "warn":
				console.warn(formatted);
				break;
			default:
				console.log(formatted);
		}

		this.sendToMcpClient(level, category, message);
	}

	// Convenience methods for different levels
	debug(category: LogCategory, message: string, data?: Record<string, unknown>): void {
		this.log("debug", category, message, data);
	}

	info(category: LogCategory, message: string, data?: Record<string, unknown>): void {
		this.log("info", category, message, data);
	}

	warn(category: LogCategory, message: string, data?: Record<string, unknown>): void {
		this.log("warn", category, message, data);
	}

	error(category: LogCategory, message: string, data?: Record<string, unknown>): void {
		this.log("error", category, message, data);
	}

	// Category-specific convenience methods
	tool(toolName: string, action: string, data?: Record<string, unknown>): void {
		this.debug("tool", `${toolName}: ${action}`, data);
	}

	resource(resourceName: string, action: string, data?: Record<string, unknown>): void {
		this.debug("resource", `${resourceName}: ${action}`, data);
	}

	cacheHit(key: string, config?: string): void {
		this.debug("cache", `HIT: ${key}`, config ? { config } : undefined);
	}

	cacheMiss(key: string, config?: string): void {
		this.debug("cache", `MISS: ${key}`, config ? { config } : undefined);
	}

	cacheSet(key: string, ttl: number): void {
		this.debug("cache", `SET: ${key}`, { ttl });
	}

	fetch(url: string, status?: number, duration?: number): void {
		this.debug("fetch", `${url}`, { status, duration });
	}

	request(method: string, path: string, data?: Record<string, unknown>): void {
		this.debug("request", `${method} ${path}`, data);
	}

	/**
	 * Set minimum log level
	 */
	setLevel(level: LogLevel): void {
		this.minLevel = level;
	}

	/**
	 * Enable/disable logging
	 */
	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
	}
}

// Export singleton instance
export const logger = new Logger();

// Export for direct import
export default logger;
