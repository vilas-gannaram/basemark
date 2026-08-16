import { toHtml } from 'hast-util-to-html';
import type { ComponentRegistry } from './registry';
import { parseMarkdown } from './parse';

// The "no live DOM at all" consumption path — a build-time/CLI consumer
// (@basemark/cli) that wants markdown resolved to a plain HTML string it can
// write to a file, not real DOM nodes (that's dom.ts's job, and needs an
// actual `document`). hast-util-to-html walks the hast tree directly with no
// DOM dependency, so this works the same in Bun/Node as it would in a
// browser — unlike dom.ts's renderMarkdown(), this needs nothing from the
// runtime beyond parseMarkdown() itself.
//
// Resolved custom-element tags (e.g. <basemark-card>) are serialized as
// plain, unupgraded markup — this only produces the light-DOM shape; making
// them interactive still requires their component JS to run in a real
// browser (see @basemark/cli's bundling step, which is a separate concern
// from this pure string serialization).
export function renderMarkdownToHtml(source: string, registry: ComponentRegistry): string {
	const hast = parseMarkdown(source, registry);
	return toHtml(hast);
}
