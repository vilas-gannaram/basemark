import type { ComponentRegistry } from '@basemark/core';
import { registerLocusZoomComponents } from './locuszoom';
import { registerProtvista } from './protvista';
import { registerStructure } from './structure';

export * from './locuszoom';
export * from './protvista';
export * from './structure';

export function registerBioComponents(registry: ComponentRegistry): void {
	registerLocusZoomComponents(registry);
	registerProtvista(registry);
	registerStructure(registry);
}
