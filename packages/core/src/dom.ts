import { toDom } from 'hast-util-to-dom';
import type { ComponentRegistry } from './registry';
import { parseMarkdown } from './parse';

// The "no framework at all" consumption path (VISION.md: direct library use,
// plain HTML). Unlike @basemark/react, this needs no per-tag wrapping —
// resolved directives are already real customElements-registered tags
// (ARCHITECTURE.md §6), so a plain browser upgrades them the moment they're
// attached to the document; there's nothing framework-specific to bridge.
// hast-util-to-dom (not a hand-rolled hast→DOM walk) handles the parts that
// are easy to get subtly wrong — hast's `className` (an array) needing to
// become a real `class` attribute, boolean attributes, SVG namespacing, etc.
//
// Kept as a separate entry point rather than folded into parseMarkdown()
// itself: parseMarkdown's output (a hast tree) is useful on its own to
// anything that walks it without touching a live DOM (e.g. @basemark/react,
// or a future static-HTML serializer) — this one specifically produces real,
// already-upgraded DOM nodes, so it's the thing that needs an actual
// `document` to exist.
export function renderMarkdown(source: string, registry: ComponentRegistry): DocumentFragment {
	const hast = parseMarkdown(source, registry);
	return toDom(hast, { fragment: true }) as DocumentFragment;
}
