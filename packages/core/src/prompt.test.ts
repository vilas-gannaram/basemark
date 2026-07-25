import { describe, expect, it } from 'vitest';
import { createRegistry } from './registry';
import { describeComponent, generateSystemPrompt } from './prompt';

function registerLocusZoom(registry: ReturnType<typeof createRegistry>) {
	registry.register('locuszoom-assoc', {
		tag: 'basemark-locuszoom-assoc',
		domain: 'bio',
		title: 'GWAS Association Plot (LocusZoom)',
		description: 'Renders an interactive regional association plot for a genomic locus.',
		schema: {
			chrom: { type: 'string', required: true, description: 'Chromosome name (e.g. "10").' },
			start: { type: 'number', required: true, description: 'Start position in base pairs.' },
			end: { type: 'number', required: true, description: 'End position in base pairs.' },
		},
	});
}

describe('generateSystemPrompt', () => {
	it('reports no components when the registry is empty', () => {
		expect(generateSystemPrompt(createRegistry())).toBe('No components are registered.');
	});

	it('produces a compact index, not full descriptions', () => {
		const registry = createRegistry();
		registerLocusZoom(registry);

		const prompt = generateSystemPrompt(registry);

		expect(prompt).toContain('::locuszoom-assoc — GWAS Association Plot (LocusZoom)');
		// The index must stay cheap — no prop schema or long description inline.
		expect(prompt).not.toContain('chrom (string, required)');
		expect(prompt).not.toContain('Renders an interactive regional association plot');
	});

	it('scopes the index to a single domain', () => {
		const registry = createRegistry();
		registerLocusZoom(registry);
		registry.register('periodic-table', {
			tag: 'basemark-periodic-table',
			domain: 'chem',
			title: 'Periodic Table',
			description: 'Renders the periodic table of elements.',
		});

		const bioPrompt = generateSystemPrompt(registry, { domain: 'bio' });
		expect(bioPrompt).toContain('locuszoom-assoc');
		expect(bioPrompt).not.toContain('periodic-table');

		const chemPrompt = generateSystemPrompt(registry, { domain: 'chem' });
		expect(chemPrompt).toContain('periodic-table');
		expect(chemPrompt).not.toContain('locuszoom-assoc');
	});
});

describe('describeComponent', () => {
	it('returns the full title, description, and schema for one component', () => {
		const registry = createRegistry();
		registerLocusZoom(registry);

		const detail = describeComponent(registry, 'locuszoom-assoc');

		expect(detail).toContain('GWAS Association Plot (LocusZoom)');
		expect(detail).toContain('Renders an interactive regional association plot for a genomic locus.');
		expect(detail).toContain('::locuszoom-assoc{...}');
		expect(detail).toContain('chrom (string, required): Chromosome name (e.g. "10").');
	});

	it('handles components with no schema', () => {
		const registry = createRegistry();
		registry.register('divider', { tag: 'basemark-divider', domain: 'common', title: 'Divider', description: 'A horizontal rule.' });

		expect(describeComponent(registry, 'divider')).toContain('(no props)');
	});

	it('throws for an unregistered component', () => {
		const registry = createRegistry();
		expect(() => describeComponent(registry, 'nope')).toThrow(/not registered/);
	});
});
