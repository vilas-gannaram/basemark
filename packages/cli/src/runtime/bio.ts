// Only inlined when a document resolves a 'bio' directive (render.ts's
// usedDomains()). Async IIFE, not top-level await — 'iife' output may not support the latter.
import { createRegistry } from '@basemark/core';
import { registerBioComponents } from '@basemark/bio';

void (async () => {
	await registerBioComponents(createRegistry());
})();
