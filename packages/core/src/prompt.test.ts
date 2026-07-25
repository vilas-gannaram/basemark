import { describe, expect, it } from 'vitest';
import { createRegistry } from './registry';
import { generateSystemPrompt } from './prompt';

describe('generateSystemPrompt', () => {
	it('reports no components when the registry is empty', () => {
		expect(generateSystemPrompt(createRegistry())).toBe('No components are registered.');
	});

	it('lists each registered component with its schema', () => {
		const registry = createRegistry();
		registry.register('locuszoom-assoc', {
			tag: 'basemark-locuszoom-assoc',
			schema: {
				chrom: { type: 'string', required: true },
				start: { type: 'number', required: true },
				end: { type: 'number', required: true },
			},
		});

		const prompt = generateSystemPrompt(registry);

		expect(prompt).toContain('::locuszoom-assoc{...}');
		expect(prompt).toContain('chrom: string (required)');
		expect(prompt).toContain('start: number (required)');
		expect(prompt).toContain('end: number (required)');
	});

	it('handles components with no schema', () => {
		const registry = createRegistry();
		registry.register('divider', { tag: 'basemark-divider' });

		expect(generateSystemPrompt(registry)).toContain('(no props)');
	});
});
