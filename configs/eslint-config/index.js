import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		rules: {
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
		},
	},
	// Must stay last: turns off stylistic rules that would otherwise conflict
	// with Prettier, which owns formatting (see root .prettierrc.json).
	eslintConfigPrettier,
	{
		ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**'],
	},
);
