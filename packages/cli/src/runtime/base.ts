// Bundled separately from common.ts/bio.ts (see scripts/bundle-runtime.ts)
// and always inlined into every render() output, regardless of which
// domain(s) a given document actually uses — an unknown directive, a failed
// prop check, or an unclosed ":::" container can all produce a
// `basemark-error` node (ARCHITECTURE.md §3's "fail visibly" contract) even
// in a document with zero resolved components, so this can't be conditional
// the way common.ts/bio.ts are.
import { registerErrorComponent } from '@basemark/core';

registerErrorComponent();
