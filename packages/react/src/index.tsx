import type { ComponentRegistry } from '@basemark/core';

export interface MarkdownRendererProps {
	source: string;
	registry: ComponentRegistry;
}

// TODO: parse `source` via @basemark/core and render resolved web-component tags.
export function MarkdownRenderer(_props: MarkdownRendererProps) {
	throw new Error('MarkdownRenderer is not implemented yet.');
}
