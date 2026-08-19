import * as React from 'react';
import { createElement, Fragment, type ComponentType, type ReactNode } from 'react';
import type { RootContent } from 'hast';
import { createComponent, type ReactWebComponent } from '@lit/react';
import { NATIVE_COMPONENT_DATA_ATTR, NATIVE_COMPONENT_TAG, parseMarkdown, type ComponentRegistry } from '@basemark/core';

export interface MarkdownRendererProps {
	source: string;
	registry: ComponentRegistry;
}

// React treats a hyphenated tag as a host element, not a component — this
// wraps any custom element generically via @lit/react's createComponent, one factory for all of them.
const wrapperCache = new Map<string, ReactWebComponent<HTMLElement> | null>();

function getWrappedComponent(tagName: string): ReactWebComponent<HTMLElement> | null {
	if (wrapperCache.has(tagName)) return wrapperCache.get(tagName) ?? null;

	const elementClass = customElements.get(tagName) as (new () => HTMLElement) | undefined;
	const component = elementClass ? createComponent({ react: React, tagName, elementClass, displayName: tagName }) : null;
	wrapperCache.set(tagName, component);
	return component;
}

// §6 escape hatch — parse.ts leaves a neutral marker; this is the one
// consumer that can honor it, swapping it for the real registered component.
function renderNativeComponent(node: RootContent & { type: 'element' }, key: number, registry: ComponentRegistry): ReactNode {
	const { [NATIVE_COMPONENT_DATA_ATTR]: name, ...props } = node.properties as Record<string, unknown>;
	const definition = registry.resolve(String(name));
	if (definition?.type !== 'react') return null;

	const Component = definition.component as ComponentType<Record<string, unknown>>;
	const children = node.children.map((child, index) => renderNode(child, index, registry));
	return createElement(Component, { key, ...props }, ...children);
}

function renderNode(node: RootContent, key: number, registry: ComponentRegistry): ReactNode {
	if (node.type === 'text') return node.value;
	if (node.type !== 'element') return null;
	if (node.tagName === NATIVE_COMPONENT_TAG) return renderNativeComponent(node, key, registry);

	const children = node.children.map((child, index) => renderNode(child, index, registry));
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
	return createElement(Fragment, null, ...hast.children.map((node, index) => renderNode(node, index, registry)));
}
