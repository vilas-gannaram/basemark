import type { ComponentRegistry } from '@basemark/core';
import { registerAssoc } from './assoc';
import { registerGwasCatalog } from './gwas-catalog';
import { registerPhewas } from './phewas';

export function registerLocusZoomComponents(registry: ComponentRegistry): void {
	registerAssoc(registry);
	registerGwasCatalog(registry);
	registerPhewas(registry);
}

export { LOCUSZOOM_ASSOC_TAG } from './assoc';
export { LOCUSZOOM_GWAS_CATALOG_TAG } from './gwas-catalog';
export { LOCUSZOOM_PHEWAS_TAG } from './phewas';
