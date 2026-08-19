// Always inlined, unlike common.ts/bio.ts/charts.ts — a doc with zero
// resolved components can still produce a basemark-error node (ARCH §3).
import { registerErrorComponent } from '@basemark/core';

registerErrorComponent();
