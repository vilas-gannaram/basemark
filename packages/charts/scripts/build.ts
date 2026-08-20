import { rm } from 'node:fs/promises';
import pkg from '../package.json' with { type: 'json' };

const outdir = new URL('../dist/', import.meta.url).pathname;
await rm(outdir, { recursive: true, force: true });

const result = await Bun.build({
	entrypoints: [new URL('../src/index.ts', import.meta.url).pathname],
	outdir,
	target: 'browser',
	format: 'esm',
	external: Object.keys(pkg.dependencies ?? {}),
});

if (!result.success) {
	const messages = result.logs.map((log) => log.message).join('\n');
	throw new Error(`Failed to build @basemark/charts:\n${messages}`);
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
	throw new Error('Failed to emit @basemark/charts declarations');
}
