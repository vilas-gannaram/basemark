// Bundles runtime-entry.ts (whose only job is calling every
// register*Components(), for its customElements.define() side effects) into
// a single browser-ready script, using Bun's built-in bundler — no webpack/
// esbuild/Vite config needed, which is the whole point of a Bun-based CLI:
// the same binary that runs this CLI can also bundle for it.
const ENTRY_POINT = new URL('./runtime-entry.ts', import.meta.url).pathname;

export async function bundleRuntime(): Promise<string> {
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

	// One entry point, no code-splitting requested — exactly one output chunk.
	return result.outputs[0]!.text();
}
