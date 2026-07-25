import { unified, type Plugin } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import { visit } from 'unist-util-visit';
import type { Root as MdastRoot } from 'mdast';
import type { Directives } from 'mdast-util-directive';
import type { Root as HastRoot } from 'hast';
import type { ComponentRegistry, PropSchema } from './registry';
import { validateProps } from './registry';

const DIRECTIVE_TYPES = ['leafDirective', 'containerDirective', 'textDirective'] as const;

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

				node.data = { ...node.data, hName: definition.tag, hProperties: props };
			},
		);
	};
};

export function parseMarkdown(source: string, registry: ComponentRegistry): HastRoot {
	const processor = unified().use(remarkParse).use(remarkDirective).use(resolveDirectives, registry).use(remarkRehype);

	const mdastTree = processor.parse(source);
	return processor.runSync(mdastTree) as HastRoot;
}
