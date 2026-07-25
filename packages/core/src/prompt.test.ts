import { describe, expect, it } from 'vitest';
import { createRegistry } from './registry';
import { generateSystemPrompt } from './prompt';

describe('generateSystemPrompt', () => {
	it('reports no components when the registry is empty', () => {
		expect(generateSystemPrompt(createRegistry())).toBe('No components are registered.');
	});

	it('lists each registered component with its title, description, and schema', () => {
		const registry = createRegistry();
		registry.register('locuszoom-assoc', {
			tag: 'basemark-locuszoom-assoc',
			title: 'GWAS Association Plot (LocusZoom)',
			description: 'Renders an interactive regional association plot for a genomic locus.',
			schema: {
				chrom: { type: 'string', required: true, description: 'Chromosome name (e.g. "10").' },
				start: { type: 'number', required: true, description: 'Start position in base pairs.' },
				end: { type: 'number', required: true, description: 'End position in base pairs.' },
			},
		});

		const prompt = generateSystemPrompt(registry);

		expect(prompt).toContain('GWAS Association Plot (LocusZoom)');
		expect(prompt).toContain('Renders an interactive regional association plot for a genomic locus.');
		expect(prompt).toContain('::locuszoom-assoc{...}');
		expect(prompt).toContain('chrom (string, required): Chromosome name (e.g. "10").');
		expect(prompt).toContain('start (number, required): Start position in base pairs.');
		expect(prompt).toContain('end (number, required): End position in base pairs.');
	});

	it('handles components with no schema or prop descriptions', () => {
		const registry = createRegistry();
		registry.register('divider', { tag: 'basemark-divider', title: 'Divider', description: 'A horizontal rule.' });

		const prompt = generateSystemPrompt(registry);
		expect(prompt).toContain('(no props)');
	});
});
