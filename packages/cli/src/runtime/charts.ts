// Bundled separately from base.ts/common.ts/bio.ts (see scripts/bundle-runtime.ts)
// and only inlined into a render() output when the document actually
// resolves at least one 'charts'-domain directive — see render.ts's
// usedDomains().
import { createRegistry } from '@basemark/core';
import { registerChartsComponents } from '@basemark/charts';

registerChartsComponents(createRegistry());
