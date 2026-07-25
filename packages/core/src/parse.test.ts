import { describe, expect, it } from 'vitest';
import type { Element, Root } from 'hast';
import { createRegistry } from './registry';
import { parseMarkdown } from './parse';

function firstElement(root: Root): Element {
	const el = root.children.find((child): child is Element => child.type === 'element');
	if (!el) throw new Error('no element node found in hast root');
	return el;
}

describe('parseMarkdown', () => {
	it('resolves a registered leaf directive to its tag and coerced props', () => {
		const registry = createRegistry();
		registry.register('locuszoom-assoc', {
			tag: 'basemark-locuszoom-assoc',
			title: 'GWAS Association Plot (LocusZoom)',
			description: 'Renders an interactive regional association plot for a genomic locus.',
			schema: {
				chrom: { type: 'string', required: true },
				start: { type: 'number', required: true },
				end: { type: 'number', required: true },
			},
		});

		const hast = parseMarkdown('::locuszoom-assoc{chrom="10" start="114550452" end="115067678"}', registry);
		const el = firstElement(hast);

		expect(el.tagName).toBe('basemark-locuszoom-assoc');
		expect(el.properties).toEqual({ chrom: '10', start: 114550452, end: 115067678 });
	});

	it('fails visibly on an unknown directive', () => {
		const registry = createRegistry();
		const hast = parseMarkdown('::not-registered{}', registry);
		const el = firstElement(hast);

		expect(el.tagName).toBe('basemark-error');
		expect(el.properties.directive).toBe('not-registered');
		expect(el.properties.message).toMatch(/Unknown component/);
	});

	it('fails visibly when a required prop is missing', () => {
		const registry = createRegistry();
		registry.register('locuszoom-assoc', {
			tag: 'basemark-locuszoom-assoc',
			title: 'GWAS Association Plot (LocusZoom)',
			description: 'Renders an interactive regional association plot for a genomic locus.',
			schema: { chrom: { type: 'string', required: true } },
		});

		const hast = parseMarkdown('::locuszoom-assoc{}', registry);
		const el = firstElement(hast);

		expect(el.tagName).toBe('basemark-error');
		expect(el.properties.message).toMatch(/missing required prop "chrom"/);
	});
});
