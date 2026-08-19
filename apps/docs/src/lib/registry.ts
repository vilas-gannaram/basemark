import { createRegistry, type ComponentRegistry } from '@basemark/core';
import { registerCommonComponents } from '@basemark/common';
import { registerBioComponents } from '@basemark/bio';
import { registerChartsComponents } from '@basemark/charts';

// Build-time registry, used inside .astro frontmatter (runs in Node — no
// DOM). Mirrors packages/cli/src/registry.ts's buildRegistry() exactly:
// safe under Node only because every register*Components() call defers its
// custom-element class (and, for bio, its vendor library imports) behind a
// `typeof HTMLElement` guard — none of that DOM-only code actually runs
// here, only the plain registry.register metadata (tag/schema/domain) does.
// async because registerBioComponents is: its vendor libraries are
// dynamically imported, not module-scope.
export async function buildRegistry(): Promise<ComponentRegistry> {
	const registry = createRegistry();
	registerCommonComponents(registry);
	await registerBioComponents(registry);
	registerChartsComponents(registry);
	return registry;
}
