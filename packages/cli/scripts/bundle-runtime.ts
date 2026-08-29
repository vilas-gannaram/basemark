// Run before packages/cli's own build (see package.json's "build" script),
// not at render time — see this file's original single-entry version (git
// history) for why a per-render bundler call doesn't survive being bundled
// itself. Built as separate bundles, one per src/runtime/*.ts entry, rather
// than one combined bundle: render.ts only inlines the ones a given
// document's resolved directives actually need (see its usedDomains()), so a
// common-only document doesn't ship bio's much heavier vendor libraries
// (3Dmol.js, protvista-uniprot, locuszoom) for nothing.
import { build } from 'tsup';

const ENTRIES = ['base', 'common', 'bio', 'charts'] as const;

await build({
	config: false, // don't merge this package's own tsup.config.ts — that one's for the main dist/index.js build
	entry: Object.fromEntries(ENTRIES.map((name) => [name, `src/runtime/${name}.ts`])),
	outDir: 'src/generated',
	format: ['iife'],
	platform: 'browser',
	minify: true,
	clean: false,
	dts: false,
	sourcemap: false,
	silent: true,
});

// bio.ts's `await import('locuszoom/dist/locuszoom.css')` makes the bundler
// emit a SEPARATE css output alongside the bio.js entry — base.js/common.js
// never produce a css output (no real .css import — common's shadow-DOM
// styles are template-literal strings in JS, not `.css` imports), so bio is
// the only one; render.ts reads it directly by its default output name.
for (const name of ENTRIES) {
	console.log(`Wrote src/generated/${name}.js`);
}
