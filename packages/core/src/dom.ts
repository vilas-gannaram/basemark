import { toDom } from 'hast-util-to-dom';
import { visit } from 'unist-util-visit';
import type { Element as HastElement, Root as HastRoot } from 'hast';
import type { ComponentRegistry } from './registry';
import { NATIVE_COMPONENT_DATA_ATTR, NATIVE_COMPONENT_TAG, parseMarkdown } from './parse';

// Plain DOM can't upgrade a `type: 'react'` definition (ARCH §6) — swap
// it for basemark-error instead of silently rendering nothing.
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
					`Component "${name}" is a native framework component (the §6 escape hatch) and has no plain-DOM ` +
					'render path — use a framework binding that supports it (e.g. @basemark/react) instead of renderMarkdown().',
				source: `::${name}{...}`,
			};
		},
	);
}

// The no-framework consumption path (VISION.md). Needs no per-tag wrapping —
// resolved tags are already real customElements, so a browser upgrades them
// on attach. Separate from parseMarkdown() since only this needs a real `document`.
export function renderMarkdown(source: string, registry: ComponentRegistry): DocumentFragment {
	const hast = parseMarkdown(source, registry);
	rejectNativeComponents(hast);
	return toDom(hast, { fragment: true }) as DocumentFragment;
}
