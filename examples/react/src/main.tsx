import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createRegistry } from '@basemark/core';
import { registerBioComponents } from '@basemark/bio';
import { registerCommonComponents } from '@basemark/common';
import { registerChartsComponents } from '@basemark/charts';
import { MarkdownRenderer } from '@basemark/react';
import '@basemark/core/theme.css';
import { GeneChip } from './gene-chip';

// Content lives in real .md files under content/, loaded as plain text via
// Vite's `?raw` import (declared by vite/client's `declare module '*?raw'`)
// — not JS string arrays. One file per pack, mirroring examples/vanilla's
// content/ layout.
import bio from '../content/bio.md?raw';
import common from '../content/common.md?raw';
import charts from '../content/charts.md?raw';

const registry = createRegistry();
// registerBioComponents is async (see packages/bio/src/index.ts) — its
// components' vendor libraries (3Dmol.js, protvista-uniprot, locuszoom) are
// dynamically imported, deferred until this call, rather than at module
// scope. Top-level await blocks the initial render until customElements.
// define() has actually run for each one, so MarkdownRenderer's @lit/react
// wrapper (which looks up customElements.get(tagName)) never races a bio tag
// that isn't defined yet.
await registerBioComponents(registry);
registerCommonComponents(registry);
registerChartsComponents(registry);

// ARCHITECTURE.md §6's native registration escape hatch: an app-local
// React component (with its own useState, no customElements involved),
// registered as `type: 'react'` instead of a tag. Never for domain packs —
// see gene-chip.tsx.
registry.register('gene-chip', {
	type: 'react',
	component: GeneChip,
	domain: 'app',
	title: 'Gene Chip',
	description:
		'An inline, clickable chip for a gene symbol — click to expand its full name and chromosome. Text directive ' +
		'only (renders inline within a sentence, not as its own block); app-local, not part of any published pack.',
	schema: {
		full: { type: 'string', description: 'Full gene name shown when expanded.' },
		chrom: { type: 'string', description: 'Chromosome, without a "chr" prefix (e.g. "10").' },
	},
});

interface Page {
	slug: string;
	label: string;
	source: string;
}

const PAGES: Page[] = [
	{ slug: 'bio', label: 'Bio', source: bio },
	{ slug: 'common', label: 'Common', source: common },
	{ slug: 'charts', label: 'Charts', source: charts },
];

// Hash-based routing — no router dependency needed for three static pages.
// Falls back to the first page for an empty or unrecognized hash (first
// load, or a stale/typo'd link).
function activeSlug(): string {
	const hash = location.hash.replace(/^#/, '');
	return PAGES.some((page) => page.slug === hash) ? hash : PAGES[0].slug;
}

function App() {
	const [slug, setSlug] = useState(activeSlug);

	useEffect(() => {
		const onHashChange = () => setSlug(activeSlug());
		window.addEventListener('hashchange', onHashChange);
		return () => window.removeEventListener('hashchange', onHashChange);
	}, []);

	const page = PAGES.find((candidate) => candidate.slug === slug) as Page;

	return (
		<>
			<nav>
				{PAGES.map((navPage) => (
					<a key={navPage.slug} href={`#${navPage.slug}`} className={navPage.slug === slug ? 'active' : undefined}>
						{navPage.label}
					</a>
				))}
			</nav>
			<div className="content">
				<MarkdownRenderer source={page.source} registry={registry} />
			</div>
		</>
	);
}

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');

createRoot(root).render(<App />);
