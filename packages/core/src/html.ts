import { toHtml } from 'hast-util-to-html';
import type { ComponentRegistry } from './registry';
import { parseMarkdown } from './parse';

// The no-live-DOM path (e.g. @basemark/cli) — a plain HTML string, no
// `document` needed, unlike dom.ts's renderMarkdown(). Tags serialize
// unupgraded; making them interactive needs the component JS in a real browser.
export function renderMarkdownToHtml(source: string, registry: ComponentRegistry): string {
	const hast = parseMarkdown(source, registry);
	return toHtml(hast);
}
