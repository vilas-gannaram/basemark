import { rm } from 'node:fs/promises';

// `bin` must be one real standalone file, not dist/index.js plus a pile of
// runtime companions — no `external`/`noExternal` split (bundle every
// dependency in) and `splitting: false` (tsup/esbuild default splitting to
// true for esm, which chunks out @basemark/bio's dynamic vendor-library
// imports even though that code never runs under Node — see AGENTS.md's
// dynamic-import guard pattern). Its assets (theme.css, the runtime IIFE
// bundles, bio.css) are baked in as string constants by
// scripts/generate-assets.ts, imported normally, rather than read off disk
// at runtime, so there's nothing left for dist/generated/ to hold.
export default {
	entry: ['src/index.ts'],
	outDir: 'dist',
	format: 'esm',
	platform: 'node',
	noExternal: [/.*/],
	splitting: false,
	dts: false,
	clean: true,
	sourcemap: false,
	async onSuccess() {
		// @basemark/bio's dynamic `import("locuszoom/dist/locuszoom.css")` (behind
		// the same HTMLElement guard as its component classes, so it never
		// actually runs under Node) still gets statically picked up as an
		// orphaned asset chunk — nothing imports it, drop it so it doesn't ship.
		await rm('dist/index.css', { force: true });
	},
};
