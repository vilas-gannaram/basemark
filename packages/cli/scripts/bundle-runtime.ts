// Run before packages/cli's own build (see package.json's "build" script),
// not at render time — see this file's original single-entry version (git
// history) for why a per-render Bun.build() call doesn't survive being
// bundled itself. Split into three separate bundles, one per src/runtime/*.ts entry,
// rather than one combined bundle: render.ts only inlines the ones a given
// document's resolved directives actually need (see its usedDomains()), so a
// common-only document doesn't ship bio's much heavier vendor libraries
// (3Dmol.js, protvista-uniprot, locuszoom) for nothing.
const ENTRIES = ['base', 'common', 'bio', 'charts'] as const;

for (const name of ENTRIES) {
	const entryPoint = new URL(`../src/runtime/${name}.ts`, import.meta.url).pathname;

	const result = await Bun.build({
		entrypoints: [entryPoint],
		target: 'browser',
		format: 'iife',
		minify: true,
	});

	if (!result.success) {
		const messages = result.logs.map((log) => log.message).join('\n');
		throw new Error(`Failed to bundle ${name} runtime:\n${messages}`);
	}

	// bio.ts's `await import('locuszoom/dist/locuszoom.css')` makes Bun's
	// bundler emit a SEPARATE `kind: 'asset'` output chunk alongside the JS
	// entry-point chunk — writing only outputs[0] (this file's original
	// version) silently dropped that CSS, leaving LocusZoom's own toolbar/
	// panel styling missing from every rendered document (confirmed: the
	// plots resolve and mount, but render unstyled). base.ts/common.ts never
	// produce a CSS chunk (no real .css import — common's shadow-DOM styles
	// are template-literal strings in JS, not `.css` imports), so this loop
	// is a no-op extra step for them, not a special case per entry.
	for (const output of result.outputs) {
		const extension = output.path.endsWith('.css') ? 'css' : 'js';
		const outputPath = new URL(`../src/generated/${name}.runtime.${extension}`, import.meta.url).pathname;
		await Bun.write(outputPath, await output.text());
		console.log(`Wrote ${outputPath}`);
	}
}
