import type { ComponentRegistry } from '@basemark/core';
import { registerLocusZoomComponents } from './locuszoom';
import { registerProtvista } from './protvista';
import { registerStructure } from './structure';
import { registerGenomeBrowser } from './genome-browser';

export * from './locuszoom';
export * from './protvista';
export * from './structure';
export * from './genome-browser';

// Run in parallel — each's vendor-library dynamic import is independent.
export async function registerBioComponents(registry: ComponentRegistry): Promise<void> {
	await Promise.all([
		registerLocusZoomComponents(registry),
		registerProtvista(registry),
		registerStructure(registry),
		registerGenomeBrowser(registry),
	]);
}
