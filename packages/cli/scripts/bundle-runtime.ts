// Run before `bun build --compile` (see package.json's "build" script), not
// at render time — see this file's original single-entry version (git
// history) for why a per-render Bun.build() call breaks inside a compiled
// binary. Split into three separate bundles, one per src/runtime/*.ts entry,
// rather than one combined bundle: render.ts only inlines the ones a given
// document's resolved directives actually need (see its usedDomains()), so a
// common-only document doesn't ship bio's much heavier vendor libraries
// (3Dmol.js, protvista-uniprot, locuszoom) for nothing.
const ENTRIES = ['base', 'common', 'bio'] as const;

for (const name of ENTRIES) {
	const entryPoint = new URL(`../src/runtime/${name}.ts`, import.meta.url).pathname;
	const outputPath = new URL(`../src/generated/${name}.runtime.js`, import.meta.url).pathname;

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

	await Bun.write(outputPath, await result.outputs[0]!.text());
	console.log(`Wrote ${outputPath}`);
}
