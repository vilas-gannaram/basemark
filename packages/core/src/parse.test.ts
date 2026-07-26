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
			domain: 'bio',
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
		// Guards against a prior bug where runSync() never received the parsed
		// file back, leaving file.value (and so every `source` property) empty.
		expect(el.properties.source).toBe('::not-registered{}');
	});

	it('fails visibly when a required prop is missing', () => {
		const registry = createRegistry();
		registry.register('locuszoom-assoc', {
			tag: 'basemark-locuszoom-assoc',
			domain: 'bio',
			title: 'GWAS Association Plot (LocusZoom)',
			description: 'Renders an interactive regional association plot for a genomic locus.',
			schema: { chrom: { type: 'string', required: true } },
		});

		const hast = parseMarkdown('::locuszoom-assoc{}', registry);
		const el = firstElement(hast);

		expect(el.tagName).toBe('basemark-error');
		expect(el.properties.message).toMatch(/missing required prop "chrom"/);
	});

	it('closes a properly-terminated container normally, without flagging it', () => {
		const registry = createRegistry();
		registry.register('card', {
			tag: 'basemark-card',
			domain: 'common',
			title: 'Card',
			description: 'A bordered container.',
			schema: { title: { type: 'string' } },
		});

		const hast = parseMarkdown([':::card{title="X"}', 'body text', ':::', '', 'after'].join('\n'), registry);
		const el = firstElement(hast);

		expect(el.tagName).toBe('basemark-card');
		// The paragraph after the closing fence is a separate top-level node,
		// not swallowed into the card.
		expect(hast.children.filter((child) => child.type === 'element')).toHaveLength(2);
	});

	it('fails visibly when a container is missing its closing fence, without dropping the swallowed content', () => {
		const registry = createRegistry();
		registry.register('card', {
			tag: 'basemark-card',
			domain: 'common',
			title: 'Card',
			description: 'A bordered container.',
			schema: { title: { type: 'string' } },
		});

		// No closing `:::` — remark-directive runs the container to the end of
		// its parent (here, the document), per micromark-extension-directive.
		const hast = parseMarkdown([':::card{title="X"}', 'body text', '', '## heading after', '', 'more text'].join('\n'), registry);
		const el = firstElement(hast);

		expect(el.tagName).toBe('basemark-error');
		expect(el.properties.directive).toBe('card');
		expect(el.properties.message).toMatch(/Missing closing ":::"/);
		// Nothing that got swallowed is dropped — it's still there as children,
		// for basemark-error's own slot to render.
		expect(el.children.some((child) => child.type === 'element' && child.tagName === 'h2')).toBe(true);
	});
});
