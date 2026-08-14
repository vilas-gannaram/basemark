import { toDom } from 'hast-util-to-dom';
import { visit } from 'unist-util-visit';
import type { Element as HastElement, Root as HastRoot } from 'hast';
import type { ComponentRegistry } from './registry';
import { NATIVE_COMPONENT_DATA_ATTR, NATIVE_COMPONENT_TAG, parseMarkdown } from './parse';

// The plain-DOM path can't do anything with a `type: 'react'` (or any other
// non-web-component) definition — there's no customElements tag to upgrade,
// by design (ARCHITECTURE.md §6/§10's escape hatch is framework-native only).
// Rather than silently rendering nothing, swap it for a basemark-error node —
// same "fail visibly" contract as an unknown directive or unclosed container
// (parse.ts), just caught here instead of at parse time, since parse.ts
// itself doesn't know which consumer will walk its output.
function rejectNativeComponents(hast: HastRoot): void {
	visit(
		hast,
		(node) => node.type === 'element' && (node as HastElement).tagName === NATIVE_COMPONENT_TAG,
		(untypedNode) => {
			const node = untypedNode as HastElement;
			const name = String(node.properties?.[NATIVE_COMPONENT_DATA_ATTR] ?? 'unknown');
			node.tagName = 'basemark-error';
			node.properties = {
				directive: name,
				message:
					`Component "${name}" is a native framework component (the §6/§10 escape hatch) and has no plain-DOM ` +
					'render path — use a framework binding that supports it (e.g. @basemark/react) instead of renderMarkdown().',
				source: `::${name}{...}`,
			};
		},
	);
}

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
	rejectNativeComponents(hast);
	return toDom(hast, { fragment: true }) as DocumentFragment;
}
