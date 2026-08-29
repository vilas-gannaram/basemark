import { baseTsupConfig } from '@basemark/tsup-config';
import pkg from './package.json' with { type: 'json' };

export default {
	...baseTsupConfig({ entry: ['src/index.ts'], external: Object.keys(pkg.dependencies ?? {}) }),
	async onSuccess() {
		const { copyFile } = await import('node:fs/promises');
		await copyFile('src/theme.css', 'dist/theme.css');
	},
};
