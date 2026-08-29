import pkg from './package.json' with { type: 'json' };

export default {
	entry: ['src/index.ts'],
	outDir: 'dist',
	format: 'esm',
	platform: 'browser',
	external: Object.keys(pkg.dependencies ?? {}),
	dts: true,
	tsconfig: 'tsconfig.build.json',
	clean: true,
	sourcemap: true,
	async onSuccess() {
		// Concatenated, not a `@import './typeset.css'` left in the shipped
		// file — packages/cli inlines this file's content into one <style>
		// tag, where a relative @import can't resolve.
		const { readFile, writeFile } = await import('node:fs/promises');
		const [theme, typeset] = await Promise.all([readFile('src/theme.css', 'utf-8'), readFile('src/typeset.css', 'utf-8')]);
		await writeFile('dist/theme.css', `${theme}\n${typeset}`);
	},
};
