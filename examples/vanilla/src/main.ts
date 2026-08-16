import { createRegistry, renderMarkdown } from '@basemark/core';
import { registerBioComponents } from '@basemark/bio';
import { registerCommonComponents } from '@basemark/common';
import '@basemark/core/theme.css';

// Content lives in real .md files under content/, loaded as plain text via
// Vite's `?raw` import (declared by vite/client's `declare module '*?raw'`)
// — not JS string arrays. Each is parsed fresh by renderMarkdown() per page
// switch, same as the single-page version this replaced.
import architecture from '../content/architecture.md?raw';
import gwasVariantReport from '../content/gwas-variant-report.md?raw';
import labProtocol from '../content/lab-protocol.md?raw';
import componentGallery from '../content/component-gallery.md?raw';

const registry = createRegistry();
registerBioComponents(registry);
registerCommonComponents(registry);

interface Page {
	slug: string;
	label: string;
	source: string;
}

const PAGES: Page[] = [
	{ slug: 'architecture', label: 'Architecture', source: architecture },
	{ slug: 'gwas-report', label: 'GWAS Variant Report', source: gwasVariantReport },
	{ slug: 'lab-protocol', label: 'Lab Protocol', source: labProtocol },
	{ slug: 'gallery', label: 'Component Gallery', source: componentGallery },
];

// Passed as parameters, not closed over as module-scope consts — TS can't
// carry a `const`'s non-null narrowing into a function body defined later,
// since the function might run at a point after some other code mutated
// things; a parameter is narrowed fresh on every call instead.
function elementById(id: string): HTMLElement {
	const el = document.getElementById(id);
	if (!el) throw new Error(`#${id} element not found`);
	return el;
}
const nav = elementById('nav');
const root = elementById('root');

// Hash-based routing — no router dependency needed for three static pages.
// Falls back to the first page for an empty or unrecognized hash (first
// load, or a stale/typo'd link).
function activeSlug(): string {
	const hash = location.hash.replace(/^#/, '');
	return PAGES.some((page) => page.slug === hash) ? hash : PAGES[0].slug;
}

function renderNav(navEl: HTMLElement, slug: string): void {
	navEl.innerHTML = '';
	for (const page of PAGES) {
		const link = document.createElement('a');
		link.href = `#${page.slug}`;
		link.textContent = page.label;
		if (page.slug === slug) link.classList.add('active');
		navEl.appendChild(link);
	}
}

function renderPage(): void {
	const slug = activeSlug();
	const page = PAGES.find((candidate) => candidate.slug === slug) as Page;
	renderNav(nav, slug);
	root.replaceChildren(renderMarkdown(page.source, registry));
}

window.addEventListener('hashchange', renderPage);
renderPage();
