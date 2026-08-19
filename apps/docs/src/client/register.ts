import { createRegistry } from '@basemark/core';
import { registerBioComponents } from '@basemark/bio';
import { registerCommonComponents } from '@basemark/common';
import { registerChartsComponents } from '@basemark/charts';

// Browser-side hydration, loaded once in DocsLayout.astro (not per-domain
// split like packages/cli's runtime bundles — that split exists to keep a
// single portable HTML file small; a multi-page site instead benefits from
// one shared bundle the browser caches across navigations). Upgrades the
// already-resolved tags (<basemark-card> etc.) that renderMarkdownToHtml()
// baked into the static HTML at build time — same shape as
// examples/vanilla/src/main.ts.
const registry = createRegistry();
await registerBioComponents(registry);
registerCommonComponents(registry);
registerChartsComponents(registry);
