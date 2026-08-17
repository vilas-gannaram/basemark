// Bundled separately from base.ts/bio.ts (see scripts/bundle-runtime.ts) and
// only inlined into a render() output when the document actually resolves at
// least one 'common'-domain directive — see render.ts's usedDomains().
import { createRegistry } from '@basemark/core';
import { registerCommonComponents } from '@basemark/common';

registerCommonComponents(createRegistry());
