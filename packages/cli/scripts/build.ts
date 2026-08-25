// Bundles to a plain Node-runnable dist/index.js — not `bun build --compile`.
// A compiled binary can't be published as a single cross-platform npm `bin`,
// and src/index.ts no longer touches any Bun-only runtime API, so a normal
// bundle (still built with Bun, only as a devDependency) is enough.
import { rm } from 'node:fs/promises';

const outdir = new URL('../dist/', import.meta.url).pathname;
await rm(outdir, { recursive: true, force: true });

// No `external` — bundle every dependency in, same as `bun build --compile`
// did. Leaving @basemark/core external broke its `theme.css` text import
// (Bun only inlines a `with { type: 'text' }` import when it's bundled).
const result = await Bun.build({
	entrypoints: [new URL('../src/index.ts', import.meta.url).pathname],
	outdir,
	target: 'node',
	format: 'esm',
});

if (!result.success) {
	const messages = result.logs.map((log) => log.message).join('\n');
	throw new Error(`Failed to build @basemark/cli:\n${messages}`);
}

for (const output of result.outputs) {
	console.log(`Wrote ${output.path}`);
}

// @basemark/bio's dynamic `import("locuszoom/dist/locuszoom.css")` (behind
// the same HTMLElement guard as its component classes, so it never actually
// runs under Node) still gets statically picked up as an orphaned asset
// chunk — nothing imports it, drop it so it doesn't ship in the npm tarball.
await rm(new URL('../dist/index.css', import.meta.url).pathname, { force: true });
