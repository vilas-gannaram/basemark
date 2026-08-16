import { createRoot } from 'react-dom/client';
import { createRegistry } from '@basemark/core';
import { registerBioComponents } from '@basemark/bio';
import { registerCommonComponents } from '@basemark/common';
import { MarkdownRenderer } from '@basemark/react';
import '@basemark/core/theme.css';
import { GeneChip } from './gene-chip';

const registry = createRegistry();
registerBioComponents(registry);
registerCommonComponents(registry);

// ARCHITECTURE.md §6/§10's native registration escape hatch: an app-local
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

const source = [
	'# One variant, many phenotypes',
	'',
	'`MarkdownRenderer` from `@basemark/react` parses the markdown below and mounts every resolved ' +
		"custom element as a real React component — via a generic wrapper (`@lit/react`'s " +
		'`createComponent`), not per-component code.',
	'',
	'**rs7903146**, in an intron of :gene-chip[TCF7L2]{full="Transcription factor 7-like 2" chrom="10"}, is ' +
		"the single most replicated hit in type 2 diabetes genetics. But a variant's associations rarely " +
		'stop at the phenotype it was first found for — the views below ask how far this one actually ' +
		"reaches. (Click the gene name — it's a real React component with its own state, registered " +
		'through the native escape hatch, ARCHITECTURE.md §6/§10 — not a Web Component.)',
	'',
	':::card{title="A phenome-wide scan"}',
	'Instead of scanning many variants across one region, this flips the axis: one variant, scanned ' +
		'across many phenotypes at once, colored by trait category.',
	'',
	'::locuszoom-phewas{variant="10:114758349_C/T"}',
	':::',
	'',
	'The signal clearly is not confined to a single trait. Two more views narrow in on *why*: what sits ' +
		'in the region at the DNA level, and how the locus behaves across other metabolic traits ' +
		'specifically.',
	'',
	'::::columns{cols="2"}',
	':::card{title="Regulatory context"}',
	'Chromatin/regulatory interval annotations across the same locus — the kind of evidence used to ' +
		'argue a variant is doing something at the DNA level, not just correlating with disease.',
	'',
	'::locuszoom-intervals{chrom="10" start="114550452" end="115067678"}',
	':::',
	'',
	':::card{title="Other metabolic traits, same locus"}',
	'Four independent metabolic-trait GWAS (fasting glucose, fasting insulin, triglycerides, total ' +
		'cholesterol) layered on the same region, so the signal can be compared across traits directly ' +
		'rather than one plot per trait.',
	'',
	'::locuszoom-multi-pheno{chrom="10" start="114550452" end="115067678"}',
	':::',
	'::::',
	'',
	'All of that pleiotropy traces back to one gene product. Two more views bring it back down to the ' +
		'protein: its sequence, and the one structure solved of it in complex with its binding partner.',
	'',
	'::::tabs',
	':::tab-panel{label="Protein sequence"}',
	'The full TCF7L2 sequence (UniProt Q9NQB0) — the gene every plot above is ultimately pointing at.',
	'',
	'::protvista{accession="Q9NQB0"}',
	':::',
	'',
	':::tab-panel{label="Bound to β-catenin"}',
	'PDB entry 1JPW — TCF7L2 in complex with β-catenin, the interaction through which it acts in Wnt ' + 'signaling.',
	'',
	'::structure{pdbid="1jpw"}',
	':::',
	'::::',
	'',
	'One variant, one gene, and a reach across an entire metabolic phenotype space — which is exactly ' +
		'the kind of cross-cutting evidence a GWAS hit needs before it becomes a drug target.',
	'',
	'---',
	'',
	'## Common component gallery',
	'',
	'Unrelated to the story above — this section exercises every `@basemark/common` component, including ' +
		'the shadcn/ui-inspired set (see `packages/common/README.md`), rendered here through ' +
		'`MarkdownRenderer` exactly like everything above: each resolves to a real React component via the ' +
		'generic `@lit/react` wrapper, not per-component code.',
	'',
	'### Buttons & badges',
	'',
	'Both are text directives, inline in a sentence: :button[Default]{} :button[Secondary]{variant="secondary"} ' +
		':button[Destructive]{variant="destructive"} :button[Outline]{variant="outline"} :button[Ghost]{variant="ghost"} ' +
		':button[Link]{variant="link"}, in :button[small]{size="sm"}, default, and :button[large]{size="lg"} sizes, ' +
		'and :button[as a link]{variant="outline" href="https://ui.shadcn.com"} when `href` is set.',
	'',
	'Badges: :badge[Beta]{} :badge[Stable]{variant="secondary"} :badge[Deprecated]{variant="destructive"} ' +
		':badge[Experimental]{variant="outline"}.',
	'',
	'### Alert',
	'',
	':::alert{title="Heads up"}',
	'Default variant — a neutral notice that deserves more attention than a plain paragraph.',
	':::',
	'',
	':::alert{variant="destructive" title="Something needs attention"}',
	'Destructive variant — warnings or errors.',
	':::',
	'',
	'### Separator',
	'',
	'::separator{}',
	'',
	'### Table',
	'',
	'Plain GFM pipe-table syntax — not a directive, themed globally in `theme.css`:',
	'',
	'| Variant | Use for |',
	'| --- | --- |',
	'| `default` | primary action / neutral emphasis |',
	'| `secondary` | lower-emphasis action |',
	'| `destructive` | dangerous or error-adjacent action |',
	'| `outline` / `ghost` | de-emphasized, chrome-light action |',
	'',
	'### Accordion',
	'',
	'::::accordion',
	':::accordion-item{label="Why a generic React wrapper instead of per-component wrappers?"}',
	'Every resolved custom element is wrapped once, generically, via `@lit/react`’s `createComponent` — ' +
		'see `MarkdownRenderer` in `@basemark/react`. Works for any custom element, no Lit dependency needed ' +
		'in the component itself.',
	':::',
	'',
	':::accordion-item{label="What about the native React escape hatch?"}',
	'That’s `gene-chip` above — a real React component (its own `useState`) registered with ' +
		"`{ type: 'react', component: GeneChip }` instead of a customElements tag. App-local only; never " +
		'for a published pack like this one.',
	':::',
	'',
	':::accordion-item{label="Does this work outside React?"}',
	'Yes — every component in this gallery is a plain Web Component. `examples/vanilla` renders the same ' +
		'set with no framework at all, via `@basemark/core`’s own `renderMarkdown()`.',
	':::',
	'::::',
	'',
	'### Carousel',
	'',
	'::::carousel',
	':::card{title="Slide 1"}',
	'Each direct child block of a `:::carousel:::` becomes one full-width, snap-aligned slide.',
	':::',
	'',
	':::card{title="Slide 2"}',
	'Sliding is pure CSS `scroll-snap` — the prev/next buttons just nudge `scrollLeft`.',
	':::',
	'',
	':::card{title="Slide 3"}',
	'Native swipe/trackpad/shift+wheel scrolling works too, for free.',
	':::',
	'::::',
	'',
	'### Popover',
	'',
	'A click-to-open panel anchored to a trigger button, closing on outside click or Escape:',
	'',
	':::popover{trigger="Why not Tailwind?" side="bottom"}',
	'The common package targets plain CSS3 against shadcn-shaped custom properties, so it renders ' +
		'identically whether the host page uses Tailwind, another CSS framework, or nothing at all.',
	':::',
].join('\n');

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');

createRoot(root).render(<MarkdownRenderer source={source} registry={registry} />);
