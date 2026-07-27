import { unified, type Plugin } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import { visit } from 'unist-util-visit';
import { VFile } from 'vfile';
import type { Root as MdastRoot } from 'mdast';
import type { Directives } from 'mdast-util-directive';
import type { Root as HastRoot } from 'hast';
import type { ComponentRegistry, PropSchema } from './registry';
import { validateProps } from './registry';
import { registerErrorComponent } from './error-element';

const DIRECTIVE_TYPES = ['leafDirective', 'containerDirective', 'textDirective'] as const;

// Marker hName for a resolved `type: 'react'` (or any future non-web-component
// escape hatch) definition — there's no real tag to emit, since it isn't a
// customElements-registered element. Framework-agnostic here on purpose:
// this module doesn't know which consumer (dom.ts, @basemark/react, ...) will
// walk the resulting hast tree, so it leaves a neutral marker plus the
// directive name in `data-basemark-component`, and each consumer decides for
// itself what it's capable of doing with that — swap in the real component
// (a framework binding that supports the escape hatch) or fail visibly (one
// that doesn't, e.g. the plain-DOM path).
export const NATIVE_COMPONENT_TAG = 'basemark-native';
export const NATIVE_COMPONENT_DATA_ATTR = 'data-basemark-component';

// A container's closing fence (`:::`, or more colons for an outer container
// wrapping a nested one — see micromark-extension-directive's readme) is its
// own source line of nothing but colons. If remark-directive never found a
// matching close, the container's raw span just runs into whatever ordinary
// content follows instead — up to the end of its parent (document, list
// item, blockquote, ...). There's no flag on the mdast node itself for this;
// the raw text's last non-blank line is the only signal available.
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

// Resolves directive nodes (`::name{...}`, `:::name{...}:::`, `:name[...]{...}`)
// against the registry between mdast and hast, per ARCHITECTURE.md §4. Unknown
// directives or failed prop validation become a `basemark-error` hast node
// instead of failing silently (§3, mitigation #4: "fail visibly").
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
	// Called here, not at module load — parseMarkdown is the only thing that
	// ever produces a basemark-error node, and this file also needs to stay
	// importable in non-DOM contexts (see registerErrorComponent's own guard).
	registerErrorComponent();

	const processor = unified().use(remarkParse).use(remarkDirective).use(resolveDirectives, registry).use(remarkRehype);

	// resolveDirectives reads the original source text back off `file.value`
	// (to slice out each directive's raw source for error messages). Passing
	// the same VFile to both parse() and runSync() is what makes that value
	// actually present — runSync(tree) with no second argument creates a
	// fresh, valueless VFile instead of reusing the one parse() made, which
	// silently left `file.value` undefined for every plugin in the pipeline.
	const file = new VFile(source);
	const mdastTree = processor.parse(file);
	return processor.runSync(mdastTree, file) as HastRoot;
}
