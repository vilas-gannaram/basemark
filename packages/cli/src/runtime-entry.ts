// Bundled by build.ts (via Bun.build, target: 'browser') into a single
// inline <script> embedded in the CLI's output HTML file. Its only job is
// side effects: calling every register*Components() so each one's
// customElements.define() calls run in the reader's actual browser — the
// registry object itself is thrown away, since by this point the document
// has already been resolved to plain tag names by @basemark/core's
// parseMarkdown() at CLI build time (see render.ts). No hydration, no
// framework runtime — once these tags are defined, the browser upgrades the
// already-serialized markup on its own.
import { createRegistry, registerErrorComponent } from '@basemark/core';
import { registerCommonComponents } from '@basemark/common';

registerErrorComponent();
registerCommonComponents(createRegistry());
