import { baseTsupConfig } from '@basemark/tsup-config';
import pkg from './package.json' with { type: 'json' };

export default baseTsupConfig({
	entry: ['src/index.tsx'],
	external: [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})],
});
