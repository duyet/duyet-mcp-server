/**
 * Secrets are not declared in wrangler.jsonc, so `wrangler types` cannot see
 * them. Declare them here instead; this file is hand-maintained and is not
 * overwritten by `bun run cf-typegen`.
 *
 * Set each one with `wrangler secret put <NAME>`.
 */
declare namespace Cloudflare {
	interface Env {
		/** Base URL of the ClickHouse HTTP interface, e.g. https://clickhouse.example.net */
		CLICKHOUSE_URL: string;
		CLICKHOUSE_USER: string;
		CLICKHOUSE_PASSWORD: string;

		/** Cloudflare Access service-token pair guarding the tunnel. */
		CF_ACCESS_CLIENT_ID: string;
		CF_ACCESS_CLIENT_SECRET: string;
	}
}
