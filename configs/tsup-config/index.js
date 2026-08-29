export function baseTsupConfig({ entry, external = [], platform = 'browser' }) {
	return {
		entry,
		outDir: 'dist',
		format: 'esm',
		platform,
		external,
		dts: true,
		tsconfig: 'tsconfig.build.json',
		clean: true,
		sourcemap: true,
	};
}
