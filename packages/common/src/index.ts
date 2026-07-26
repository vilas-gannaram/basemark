import type { ComponentRegistry } from '@basemark/core';
import { registerCard } from './card';
import { registerColumns } from './columns';
import { registerTabs } from './tabs';

export * from './card';
export * from './columns';
export * from './tabs';

// TODO: register table/chart/map/katex web components once implemented.
export function registerCommonComponents(registry: ComponentRegistry): void {
	registerCard(registry);
	registerColumns(registry);
	registerTabs(registry);
}
