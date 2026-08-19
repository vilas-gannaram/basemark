import type { ComponentRegistry } from '@basemark/core';
import { registerLocusZoomComponents } from './locuszoom';
import { registerProtvista } from './protvista';
import { registerStructure } from './structure';
import { registerGenomeBrowser } from './genome-browser';
import { registerFasta } from './fasta';
import { registerNewick } from './newick';

export * from './locuszoom';
export * from './protvista';
export * from './structure';
export * from './genome-browser';
export * from './fasta';
export * from './newick';

// Run in parallel — each's vendor-library dynamic import is independent.
export async function registerBioComponents(registry: ComponentRegistry): Promise<void> {
	await Promise.all([
		registerLocusZoomComponents(registry),
		registerProtvista(registry),
		registerStructure(registry),
		registerGenomeBrowser(registry),
		registerFasta(registry),
		registerNewick(registry),
	]);
}
