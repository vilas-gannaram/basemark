import { slugify } from './slug';

export interface ITocItem {
	id: string;
	text: string;
	level: 2 | 3;
}

const HEADING_RE = /<(h[23])>([\s\S]*?)<\/\1>/g;

// Injects an id into each h2/h3 in already-rendered HTML and returns the
// items for an "on this page" nav. Headings are content-authored (## / ###
// in our own .md files), never attacker-controlled — same trust level as
// render-content.ts's own href-rewriting regex over the same HTML.
export function extractToc(html: string): { html: string; items: ITocItem[] } {
	const items: ITocItem[] = [];
	const seen = new Map<string, number>();

	const rewritten = html.replace(HEADING_RE, (match, tag: string, inner: string) => {
		const text = inner.replace(/<[^>]+>/g, '').trim();
		if (!text) return match;

		let slug = slugify(text);
		const count = seen.get(slug) ?? 0;
		seen.set(slug, count + 1);
		if (count > 0) slug = `${slug}-${count}`;

		items.push({ id: slug, text, level: tag === 'h2' ? 2 : 3 });
		return `<${tag} id="${slug}">${inner}</${tag}>`;
	});

	return { html: rewritten, items };
}
