// Run before `bun build --compile` (see package.json's "build" script), not
// at render time. A per-render Bun.build() call (the original approach)
// needs real files on disk to read source from — which works fine under
// `bun run`, but not from inside a compiled binary's embedded virtual
// filesystem (`/$bunfs/...`). Bundling once here and writing the result to a
// real file lets render.ts pull it in via a *static* text import instead,
// which Bun's compiler can see and embed at compile time — same mechanism
// already used for @basemark/core's theme.css.
const ENTRY_POINT = new URL('../src/runtime-entry.ts', import.meta.url).pathname;
const OUTPUT_PATH = new URL('../src/generated/runtime.js', import.meta.url).pathname;

const result = await Bun.build({
	entrypoints: [ENTRY_POINT],
	target: 'browser',
	format: 'iife',
	minify: true,
});

if (!result.success) {
	const messages = result.logs.map((log) => log.message).join('\n');
	throw new Error(`Failed to bundle component runtime:\n${messages}`);
}

await Bun.write(OUTPUT_PATH, await result.outputs[0]!.text());
console.log(`Wrote ${OUTPUT_PATH}`);
