import type { ComponentRegistry } from '@basemark/core';
import { registerLocusZoomComponents } from './locuszoom';

export * from './locuszoom';

export function registerBioComponents(registry: ComponentRegistry): void {
	registerLocusZoomComponents(registry);
}
