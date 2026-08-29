import { createRegistry, type ComponentRegistry } from '@basemark/core';
import { registerCommonComponents } from '@basemark/common';
import { registerBioComponents } from '@basemark/bio';
import { registerChartsComponents } from '@basemark/charts';

// Build-time registry for .astro frontmatter (Node, no DOM). Mirrors
// packages/cli/src/registry.ts's buildRegistry(); async because
// registerBioComponents dynamically imports its vendor libraries.
export async function buildRegistry(): Promise<ComponentRegistry> {
	const registry = createRegistry();
	registerCommonComponents(registry);
	await registerBioComponents(registry);
	registerChartsComponents(registry);
	return registry;
}
