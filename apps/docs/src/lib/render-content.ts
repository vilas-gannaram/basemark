import { renderMarkdownToHtml, type ComponentRegistry } from '@basemark/core';
import { extractToc, type ITocItem } from './toc';

// Astro's `base` only prefixes URLs Astro itself generates, not raw
// href="/..." strings baked into rendered markdown — rewrite those by hand.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export interface IRenderedContent {
	html: string;
	toc: ITocItem[];
}

export function renderContent(source: string, registry: ComponentRegistry): IRenderedContent {
	const rawHtml = renderMarkdownToHtml(source, registry);
	const { html, items } = extractToc(rawHtml);
	return {
		html: BASE ? html.replace(/href="\/(?!\/)/g, `href="${BASE}/`) : html,
		toc: items,
	};
}
