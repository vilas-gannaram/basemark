import { createElement, Fragment, type ReactNode } from 'react';
import type { RootContent } from 'hast';
import { parseMarkdown, type ComponentRegistry } from '@basemark/core';

export interface MarkdownRendererProps {
	source: string;
	registry: ComponentRegistry;
}

// Custom-element tag names (containing a hyphen) render as plain host
// elements in React — no wrapper library needed for the default web-component
// render path (ARCHITECTURE.md §6). Props are hast `properties`, spread
// as-is; React sets unrecognized props on a hyphenated tag as DOM attributes,
// which is exactly what the components' `attributeChangedCallback` expects.
function renderNode(node: RootContent, key: number): ReactNode {
	if (node.type === 'text') return node.value;
	if (node.type !== 'element') return null;

	const children = node.children.map(renderNode);
	return createElement(node.tagName, { key, ...node.properties }, ...children);
}

export function MarkdownRenderer({ source, registry }: MarkdownRendererProps): ReactNode {
	const hast = parseMarkdown(source, registry);
	return createElement(Fragment, null, ...hast.children.map(renderNode));
}
