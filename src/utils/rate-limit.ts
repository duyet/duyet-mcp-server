import { eq, sql, and, gte } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { contacts } from "../database/schema";
import type * as schema from "../database/schema";

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG = {
	// Maximum submissions per email per hour
	MAX_PER_EMAIL_PER_HOUR: 3,
	// Maximum submissions per purpose per hour (global)
	MAX_PER_PURPOSE_PER_HOUR: 20,
	// Time window in milliseconds (1 hour)
	TIME_WINDOW_MS: 60 * 60 * 1000,
};

export interface RateLimitResult {
	allowed: boolean;
	reason?: string;
	retryAfter?: number; // seconds until next attempt allowed
}

/**
 * Check if a contact submission should be rate limited
 */
export async function checkRateLimit(
	db: DrizzleD1Database<typeof schema>,
	contactEmail: string | undefined,
	purpose: string,
): Promise<RateLimitResult> {
	const now = Date.now();
	const windowStart = Math.floor((now - RATE_LIMIT_CONFIG.TIME_WINDOW_MS) / 1000);

	// Check email-based rate limit if email is provided
	if (contactEmail) {
		try {
			const recentByEmail = await db
				.select({ id: contacts.id, createdAt: contacts.createdAt })
				.from(contacts)
				.where(
					and(
						eq(contacts.contactEmail, contactEmail),
						gte(contacts.createdAt, new Date(windowStart * 1000)),
					),
				)
				.all();

			if (recentByEmail.length >= RATE_LIMIT_CONFIG.MAX_PER_EMAIL_PER_HOUR) {
				// Find oldest submission to calculate retry time
				const oldestSubmission = recentByEmail.reduce((oldest, current) => {
					const currentTime = current.createdAt?.getTime() || 0;
					const oldestTime = oldest.createdAt?.getTime() || 0;
					return currentTime < oldestTime ? current : oldest;
				});

				const oldestTime = oldestSubmission.createdAt?.getTime() || now;
				const retryAfter = Math.ceil(
					(oldestTime + RATE_LIMIT_CONFIG.TIME_WINDOW_MS - now) / 1000,
				);

				return {
					allowed: false,
					reason: `Rate limit exceeded. You've submitted ${recentByEmail.length} messages in the last hour. Please try again later.`,
					retryAfter: Math.max(retryAfter, 60), // minimum 1 minute
				};
			}
		} catch (error) {
			// If rate limit check fails, allow the submission (fail open)
			console.error("Rate limit check failed:", error);
		}
	}

	// Check purpose-based rate limit (global protection against spam)
	try {
		const recentByPurpose = await db
			.select({ count: sql<number>`count(*)` })
			.from(contacts)
			.where(
				and(
					sql`${contacts.purpose} = ${purpose}`,
					gte(contacts.createdAt, new Date(windowStart * 1000)),
				),
			)
			.get();

		const count = recentByPurpose?.count || 0;
		if (count >= RATE_LIMIT_CONFIG.MAX_PER_PURPOSE_PER_HOUR) {
			return {
				allowed: false,
				reason: "Service temporarily unavailable due to high volume. Please try again in a few minutes.",
				retryAfter: 300, // 5 minutes
			};
		}
	} catch (error) {
		// If rate limit check fails, allow the submission (fail open)
		console.error("Purpose-based rate limit check failed:", error);
	}

	return { allowed: true };
}
