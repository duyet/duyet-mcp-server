/**
 * Debug logging utility for MCP server
 *
 * Provides structured logging with levels and categories.
 * All debug logs can be enabled/disabled via environment.
 */

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
	private minLevel: LogLevel = "debug";

	private levelPriority: Record<LogLevel, number> = {
		debug: 0,
		info: 1,
		warn: 2,
		error: 3,
	};

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
