import { unified, type Plugin } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import { visit } from 'unist-util-visit';
import { VFile } from 'vfile';
import type { Root as MdastRoot } from 'mdast';
import type { Directives } from 'mdast-util-directive';
import type { Root as HastRoot } from 'hast';
import type { ComponentRegistry, PropSchema } from './registry';
import { validateProps } from './registry';
import { registerErrorComponent } from './error-element';

const DIRECTIVE_TYPES = ['leafDirective', 'containerDirective', 'textDirective'] as const;

// Marker hName for a resolved `type: 'react'` escape-hatch definition — no
// real customElements tag to emit. Each consumer (dom.ts, @basemark/react)
// decides for itself what to do with the marker + directive name.
export const NATIVE_COMPONENT_TAG = 'basemark-native';
export const NATIVE_COMPONENT_DATA_ATTR = 'data-basemark-component';

// remark-directive gives no flag for an unclosed container — the raw text's
// last non-blank line (a bare closing-colon fence, or not) is the only signal.
const CLOSING_FENCE_LINE = /^:{3,}\s*$/;

function isUnclosedContainer(raw: string): boolean {
	const lines = raw.split('\n').filter((line) => line.trim() !== '');
	const lastLine = lines.at(-1) ?? '';
	return !CLOSING_FENCE_LINE.test(lastLine);
}

function coerceValue(raw: string, type: PropSchema['type'] | undefined): string | number | boolean {
	if (type === 'number') {
		const asNumber = Number(raw);
		return Number.isNaN(asNumber) ? raw : asNumber;
	}
	if (type === 'boolean') return raw === 'true';
	return raw;
}

function markAsError(node: Directives, source: string, directive: string, message: string): void {
	node.data = {
		...node.data,
		hName: 'basemark-error',
		hProperties: { directive, message, source },
	};
}

// Resolves directive nodes against the registry between mdast and hast (ARCH
// §4). Unknown directives/failed validation become basemark-error (§3).
export const resolveDirectives: Plugin<[ComponentRegistry], MdastRoot> = (registry) => {
	return (tree, file) => {
		visit(
			tree,
			(node) => DIRECTIVE_TYPES.includes(node.type as (typeof DIRECTIVE_TYPES)[number]),
			(untypedNode) => {
				const node = untypedNode as Directives;
				const raw = node.position ? String(file.value).slice(node.position.start.offset, node.position.end.offset) : '';
				const definition = registry.resolve(node.name);

				if (!definition) {
					markAsError(node, raw, node.name, `Unknown component "${node.name}"`);
					return;
				}

				const attributes = node.attributes ?? {};
				const props: Record<string, string | number | boolean> = {};
				for (const [key, value] of Object.entries(attributes)) {
					if (value == null) continue;
					props[key] = coerceValue(value, definition.schema?.[key]?.type);
				}

				const errors = validateProps(definition.schema, props);
				if (errors.length > 0) {
					markAsError(node, raw, node.name, errors.join('; '));
					return;
				}

				if (node.type === 'containerDirective' && isUnclosedContainer(raw)) {
					// node.children are left untouched (same as markAsError elsewhere) —
					// whatever got swallowed still renders, via basemark-error's own
					// slot, instead of silently disappearing along with the warning.
					markAsError(
						node,
						raw.split('\n')[0],
						node.name,
						`Missing closing ":::" for ":::${node.name}" — everything below, up to the end of its ` +
							'parent, was captured inside this component instead of rendering as separate content.',
					);
					return;
				}

				if (definition.type === 'react') {
					node.data = {
						...node.data,
						hName: NATIVE_COMPONENT_TAG,
						hProperties: { [NATIVE_COMPONENT_DATA_ATTR]: node.name, ...props },
					};
					return;
				}

				node.data = { ...node.data, hName: definition.tag, hProperties: props };
			},
		);
	};
};

export function parseMarkdown(source: string, registry: ComponentRegistry): HastRoot {
	// Called here, not at module load, so this file stays importable DOM-less.
	registerErrorComponent();

	// plainText: ['mermaid'] placeholder for ARCH §8's future raw-fence escape
	// hatch — its blocks must bypass highlighting once that lands.
	const processor = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkDirective)
		.use(resolveDirectives, registry)
		.use(remarkRehype)
		.use(rehypeHighlight, { plainText: ['mermaid'] });

	// Same VFile passed to both — runSync(tree) alone makes a fresh, valueless
	// one, silently breaking resolveDirectives' raw-source slicing (AGENTS.md pitfall).
	const file = new VFile(source);
	const mdastTree = processor.parse(file);
	return processor.runSync(mdastTree, file) as HastRoot;
}
