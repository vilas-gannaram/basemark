import { createRegistry, type ComponentRegistry } from '@basemark/core';
import { registerCommonComponents } from '@basemark/common';
import { registerBioComponents } from '@basemark/bio';
import { registerChartsComponents } from '@basemark/charts';

// Build-time registry for parseMarkdown() under Bun, no browser present —
// safe only because every register*Components() defers DOM-only code behind
// the `typeof HTMLElement` guard (AGENTS.md). @basemark/chem: still a stub, not registered.
export async function buildRegistry(): Promise<ComponentRegistry> {
	const registry = createRegistry();
	registerCommonComponents(registry);
	await registerBioComponents(registry);
	registerChartsComponents(registry);
	return registry;
}
