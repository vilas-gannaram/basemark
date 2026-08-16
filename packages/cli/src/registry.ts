import { createRegistry, type ComponentRegistry } from '@basemark/core';
import { registerCommonComponents } from '@basemark/common';

// The CLI's build-time registry — used by @basemark/core's parseMarkdown()
// to resolve directive names to tags and validate props while running in
// Bun, with no browser present. Every register*Components() call here is
// safe under that constraint only because each component's custom-element
// class is now declared inside its own register function, guarded behind a
// `typeof HTMLElement` check (see packages/common's card.ts et al.) — none
// of that DOM-only code actually runs here, only the plain registry.register
// metadata (tag/schema) does.
//
// @basemark/bio is deliberately not registered yet: its components import
// heavy vendor libraries (3dmol, protvista-uniprot, locuszoom) at module
// scope, which isn't safe to import under Bun today — a separate follow-up,
// not part of this CLI's first slice.
export function buildRegistry(): ComponentRegistry {
	const registry = createRegistry();
	registerCommonComponents(registry);
	return registry;
}
