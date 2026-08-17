import type { ComponentRegistry } from '@basemark/core';
import { registerAssoc } from './assoc';
import { registerCredibleSets } from './credible-sets';
import { registerGwasCatalog } from './gwas-catalog';
import { registerIntervals } from './intervals';
import { registerMultiPheno } from './multi-pheno';
import { registerPhewas } from './phewas';

// registerTabix (./tabix.ts) is intentionally not called here: it's blocked
// by real bugs in `tabix-reader`'s vendored jszlib, which only surface under
// ESM's strict mode (silently masked in old-style script/CJS usage) —
// `nowrap = 0` instead of `this.nowrap = 0` in Inflate.inflateInit, and
// `z._adler` read but never assigned in InfBlocks.reset. The component
// itself is complete and verified against examples/ext/tabix_tracks.html;
// call registerTabix(registry) directly if you want it despite the crash.
export { registerTabix } from './tabix';

// async — each of these is now async itself (see shared.ts's
// createLocusZoomElement comment: 'locuszoom' can't be a top-level import
// outside a browser, so building each element is deferred to a dynamic
// import). Run in parallel, not sequentially, since none depend on another's
// result — each just needs its own dynamic import of the same underlying
// 'locuszoom' module (which the runtime module cache dedupes for free).
export async function registerLocusZoomComponents(registry: ComponentRegistry): Promise<void> {
	await Promise.all([
		registerAssoc(registry),
		registerGwasCatalog(registry),
		registerPhewas(registry),
		registerIntervals(registry),
		registerCredibleSets(registry),
		registerMultiPheno(registry),
	]);
}

export { LOCUSZOOM_ASSOC_TAG } from './assoc';
export { LOCUSZOOM_GWAS_CATALOG_TAG } from './gwas-catalog';
export { LOCUSZOOM_PHEWAS_TAG } from './phewas';
export { LOCUSZOOM_INTERVALS_TAG } from './intervals';
export { LOCUSZOOM_CREDIBLE_SETS_TAG } from './credible-sets';
export { LOCUSZOOM_MULTI_PHENO_TAG } from './multi-pheno';
export { LOCUSZOOM_TABIX_TAG } from './tabix';
