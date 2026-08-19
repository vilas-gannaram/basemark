import type { ComponentRegistry } from '@basemark/core';
import { registerAssoc } from './assoc';
import { registerCredibleSets } from './credible-sets';
import { registerGwasCatalog } from './gwas-catalog';
import { registerIntervals } from './intervals';
import { registerMultiPheno } from './multi-pheno';
import { registerPhewas } from './phewas';

// Not called below — blocked by real bugs in tabix-reader's vendored jszlib
// under ESM strict mode. Complete and verified otherwise; call registerTabix(registry) directly if you want it.
export { registerTabix } from './tabix';

// Parallel, not sequential — each just needs its own dynamic import of
// 'locuszoom' (module cache dedupes it for free). See shared.ts.
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
