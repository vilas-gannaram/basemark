import pkg from './package.json' with { type: 'json' };

export default {
	entry: ['src/index.tsx'],
	outDir: 'dist',
	format: 'esm',
	platform: 'browser',
	external: [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})],
	dts: true,
	tsconfig: 'tsconfig.build.json',
	clean: true,
	sourcemap: true,
};
