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
].join('\n');

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');

createRoot(root).render(<MarkdownRenderer source={source} registry={registry} />);
