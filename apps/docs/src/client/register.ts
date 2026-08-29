import { createRegistry } from '@basemark/core';
import { registerBioComponents } from '@basemark/bio';
import { registerCommonComponents } from '@basemark/common';
import { registerChartsComponents } from '@basemark/charts';

// Browser-side hydration, loaded once in DocsLayout.astro. Upgrades the
// already-resolved tags that renderMarkdownToHtml() baked into the static
// HTML at build time — one shared bundle, unlike packages/cli's split.
const registry = createRegistry();
await registerBioComponents(registry);
registerCommonComponents(registry);
registerChartsComponents(registry);
