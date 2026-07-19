/**
 * Forward contact/hiring submissions to Duyet in real time.
 *
 * Channels activate only when their secrets are configured (wrangler secret put):
 * - Telegram: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
 * - Email:    RESEND_API_KEY (sends via Resend to me@duyet.net)
 *
 * Fire-and-forget: failures are logged, never surfaced to the MCP client.
 */

import { logger } from "./logger";

interface NotifyEnv {
	TELEGRAM_BOT_TOKEN?: string;
	TELEGRAM_CHAT_ID?: string;
	RESEND_API_KEY?: string;
}

async function sendTelegram(env: NotifyEnv, text: string): Promise<void> {
	if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;

	const response = await fetch(
		`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: text.slice(0, 4000) }),
		},
	);
	if (!response.ok) throw new Error(`Telegram API returned ${response.status}`);
}

async function sendEmail(env: NotifyEnv, subject: string, text: string): Promise<void> {
	if (!env.RESEND_API_KEY) return;

	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: "MCP Server <mcp@duyet.net>",
			to: ["me@duyet.net"],
			subject,
			text,
		}),
	});
	if (!response.ok) throw new Error(`Resend API returned ${response.status}`);
}

export async function notifyDuyet(env: unknown, subject: string, body: string): Promise<void> {
	const notifyEnv = env as NotifyEnv;
	const text = `${subject}\n\n${body}`;

	const results = await Promise.allSettled([
		sendTelegram(notifyEnv, text),
		sendEmail(notifyEnv, subject, body),
	]);

	for (const result of results) {
		if (result.status === "rejected") {
			logger.warn("request", "Notification channel failed", {
				error:
					result.reason instanceof Error ? result.reason.message : String(result.reason),
			});
		}
	}
}
