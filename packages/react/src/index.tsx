import * as React from 'react';
import { createElement, Fragment, type ReactNode } from 'react';
import type { RootContent } from 'hast';
import { createComponent, type ReactWebComponent } from '@lit/react';
import { parseMarkdown, type ComponentRegistry } from '@basemark/core';

export interface MarkdownRendererProps {
	source: string;
	registry: ComponentRegistry;
}

// Every resolved directive becomes a registered custom element (ARCHITECTURE.md
// §6), but React treats a bare hyphenated tag name as a host element, not a
// component. This wraps any custom element generically — one factory here,
// not one wrapper per component — via @lit/react's createComponent, which
// works with any customElements-registered class regardless of how it was
// authored. Plain markdown tags (p, a, strong, ...) are never registered
// custom elements, so they fall through to a normal host element.
const wrapperCache = new Map<string, ReactWebComponent<HTMLElement> | null>();

function getWrappedComponent(tagName: string): ReactWebComponent<HTMLElement> | null {
	if (wrapperCache.has(tagName)) return wrapperCache.get(tagName) ?? null;

	const elementClass = customElements.get(tagName) as (new () => HTMLElement) | undefined;
	const component = elementClass
		? createComponent({ react: React, tagName, elementClass, displayName: tagName })
		: null;
	wrapperCache.set(tagName, component);
	return component;
}

function renderNode(node: RootContent, key: number): ReactNode {
	if (node.type === 'text') return node.value;
	if (node.type !== 'element') return null;

	const children = node.children.map(renderNode);
	// hast `properties` values (arbitrary attribute data) don't line up
	// statically with either the host-element or wrapped-component prop
	// types, since both are runtime-determined here.
	const props = { key, ...node.properties } as Record<string, unknown>;
	const Component = getWrappedComponent(node.tagName);
	if (Component) return createElement(Component, props, ...children);
	return createElement(node.tagName, props, ...children);
}

export function MarkdownRenderer({ source, registry }: MarkdownRendererProps): ReactNode {
	const hast = parseMarkdown(source, registry);
	return createElement(Fragment, null, ...hast.children.map(renderNode));
}
