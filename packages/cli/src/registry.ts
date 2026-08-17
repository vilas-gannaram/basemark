import { createRegistry, type ComponentRegistry } from '@basemark/core';
import { registerCommonComponents } from '@basemark/common';
import { registerBioComponents } from '@basemark/bio';

// The CLI's build-time registry — used by @basemark/core's parseMarkdown()
// to resolve directive names to tags and validate props while running in
// Bun, with no browser present. Every register*Components() call here is
// safe under that constraint only because each component's custom-element
// class (and, for @basemark/bio, each vendor library import — 3Dmol.js,
// protvista-uniprot, locuszoom) is deferred behind a `typeof HTMLElement`
// guard (see packages/common's card.ts et al. and packages/bio's
// structure.ts/protvista.ts/locuszoom/shared.ts) — none of that DOM-only
// code actually runs here, only the plain registry.register metadata
// (tag/schema/domain) does. async because registerBioComponents is: its
// vendor libraries are dynamically imported, not module-scope.
//
// @basemark/chem isn't registered — still an empty stub, nothing to
// register yet.
export async function buildRegistry(): Promise<ComponentRegistry> {
	const registry = createRegistry();
	registerCommonComponents(registry);
	await registerBioComponents(registry);
	return registry;
}
