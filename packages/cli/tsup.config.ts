import { copyFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// No `external`/`noExternal` split — bundle every dependency in, so the
// published npm `bin` is a single self-contained dist/index.js.
export default {
	entry: ['src/index.ts'],
	outDir: 'dist',
	format: 'esm',
	platform: 'node',
	noExternal: [/.*/],
	dts: false,
	clean: true,
	sourcemap: true,
	async onSuccess() {
		await mkdir('dist/generated', { recursive: true });
		const themeCssPath = fileURLToPath(import.meta.resolve('@basemark/core/theme.css'));
		await copyFile(themeCssPath, 'dist/generated/theme.css');
		for (const name of ['base', 'common', 'bio', 'charts']) {
			await copyFile(`src/generated/${name}.global.js`, `dist/generated/${name}.global.js`);
		}
		await copyFile('src/generated/bio.css', 'dist/generated/bio.css');

		// @basemark/bio's dynamic `import("locuszoom/dist/locuszoom.css")` (behind
		// the same HTMLElement guard as its component classes, so it never
		// actually runs under Node) still gets statically picked up as an
		// orphaned asset chunk — nothing imports it, drop it so it doesn't ship.
		await rm('dist/index.css', { force: true });
	},
};
