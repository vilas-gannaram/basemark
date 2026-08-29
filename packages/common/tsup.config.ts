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
};
