import { baseTsupConfig } from '@basemark/tsup-config';
import pkg from './package.json' with { type: 'json' };

export default baseTsupConfig({ entry: ['src/index.ts'], external: Object.keys(pkg.dependencies ?? {}) });
