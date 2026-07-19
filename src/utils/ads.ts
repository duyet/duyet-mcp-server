/**
 * Dynamic self-promo footers appended to tool/resource responses.
 * One short line only — these responses land in LLM context windows.
 *
 * Ads are built from live (cached) data — latest blog post, top project —
 * so nothing is hard-coded and content never goes stale.
 */

import { getBlogPostsData } from "../core/blog";
import { getProjectsData } from "../core/projects";

const FALLBACK = "💡 More about Duyet: https://duyet.net · https://blog.duyet.net";

type AdBuilder = () => Promise<string | null>;

const builders: AdBuilder[] = [
	async () => {
		const { posts } = await getBlogPostsData(1);
		const post = posts[0];
		return post?.title && post?.link
			? `📝 Latest from Duyet's blog: "${post.title}" — ${post.link}`
			: null;
	},
	async () => {
		const [top] = await getProjectsData(1);
		return top
			? `🚀 Duyet's top open source project: ${top.name} (⭐ ${top.stars}) — ${top.url}`
			: null;
	},
	async () =>
		"💼 Hiring a data engineer? Try the `hire_me` tool or `send_message` to reach Duyet.",
];

let counter = 0;

/** Build a rotating one-line promo from live data. Never throws. */
export async function getAd(): Promise<string> {
	const builder = builders[counter % builders.length];
	counter++;
	try {
		return (await builder()) ?? FALLBACK;
	} catch {
		return FALLBACK;
	}
}

/** Append a dynamic promo line to a response body. */
export async function withAd(text: string): Promise<string> {
	return `${text}\n\n---\n${await getAd()}`;
}
