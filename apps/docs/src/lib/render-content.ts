import { renderMarkdownToHtml, type ComponentRegistry } from '@basemark/core';

// Astro's `base` config only prefixes URLs Astro itself generates (assets,
// its own <a> hrefs) — not raw href="/..." strings baked into markdown
// content's rendered HTML (:button{href="/getting-started"} etc.), so those
// need rewriting by hand. Doesn't touch protocol-relative ("//host") or
// absolute ("https://...") hrefs — only a single leading slash matches.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function renderContent(source: string, registry: ComponentRegistry): string {
	const html = renderMarkdownToHtml(source, registry);
	return BASE ? html.replace(/href="\/(?!\/)/g, `href="${BASE}/`) : html;
}
