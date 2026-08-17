// Bundled separately from base.ts/common.ts (see scripts/bundle-runtime.ts)
// and only inlined into a render() output when the document actually
// resolves at least one 'bio'-domain directive — see render.ts's
// usedDomains(). registerBioComponents is async (its vendor libraries —
// 3Dmol.js, protvista-uniprot, locuszoom — are dynamically imported, not
// module-scope), so this wraps it in its own async IIFE rather than relying
// on top-level await, which the bundler's 'iife' output format may not
// support the same way a real ES module would.
import { createRegistry } from '@basemark/core';
import { registerBioComponents } from '@basemark/bio';

void (async () => {
	await registerBioComponents(createRegistry());
})();
