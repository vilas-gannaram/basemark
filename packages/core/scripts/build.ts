// Prototype for the unconditional dist/ publish approach (see root
// PRE_RELEASE.md). Bundles JS with Bun, emits .d.ts with a separate tsc
// pass — same split @basemark/cli's compiled binary can't use (declarations
// aren't executable), chosen here because Bun.build() doesn't emit .d.ts.
import { rm } from 'node:fs/promises';
import pkg from '../package.json' with { type: 'json' };

const outdir = new URL('../dist/', import.meta.url).pathname;
await rm(outdir, { recursive: true, force: true });

const entryPoint = new URL('../src/index.ts', import.meta.url).pathname;

const result = await Bun.build({
	entrypoints: [entryPoint],
	outdir,
	target: 'browser',
	format: 'esm',
	external: Object.keys(pkg.dependencies ?? {}),
});

if (!result.success) {
	const messages = result.logs.map((log) => log.message).join('\n');
	throw new Error(`Failed to build @basemark/core:\n${messages}`);
}

for (const output of result.outputs) {
	console.log(`Wrote ${output.path}`);
}

const dts = Bun.spawnSync(['bun', 'x', 'tsc', '--project', 'tsconfig.build.json'], {
	cwd: new URL('..', import.meta.url).pathname,
	stdout: 'inherit',
	stderr: 'inherit',
});
if (dts.exitCode !== 0) {
	throw new Error('Failed to emit @basemark/core declarations');
}

await Bun.write(`${outdir}theme.css`, Bun.file(new URL('../src/theme.css', import.meta.url)));
console.log(`Wrote ${outdir}theme.css`);
