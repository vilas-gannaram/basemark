import type { ComponentRegistry } from '@basemark/core';
import { registerLocusZoomComponents } from './locuszoom';
import { registerProtvista } from './protvista';
import { registerStructure } from './structure';

export * from './locuszoom';
export * from './protvista';
export * from './structure';

// async — each register* here now is (see locuszoom/index.ts's comment).
// Run in parallel: none depend on another's result, and each's dynamic
// import of its own vendor library (3Dmol.js, protvista-uniprot, locuszoom)
// is independent of the others.
export async function registerBioComponents(registry: ComponentRegistry): Promise<void> {
	await Promise.all([registerLocusZoomComponents(registry), registerProtvista(registry), registerStructure(registry)]);
}
