import type { ComponentRegistry } from '@basemark/core';
import { createLocusZoomElement, LOCUSZOOM_API_BASE } from './shared';

export const LOCUSZOOM_ASSOC_TAG = 'basemark-locuszoom-assoc';

const OBSERVED_ATTRS = ['chrom', 'start', 'end'] as const;

// registerAssoc is async — see shared.ts's createLocusZoomElement comment.
// The element itself is built here, inside the guarded function, rather than
// at module scope (as it used to be): its buildDataSources/buildLayout
// closures need a real `LocusZoom` value, which only exists after
// createLocusZoomElement's own dynamic import resolves.
export async function registerAssoc(registry: ComponentRegistry): Promise<void> {
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		// Mirrors the data sources used by LocusZoom's own standard association
		// demo (region 10:114550452-115067678, T2D GWAS meta-analysis, source id
		// 45) — verified against locuszoom@0.14.0's `index.html`. This is the
		// whole point of the Tier-2 design: the layout and sources are fixed
		// inside the component, and the directive only ever exposes
		// chrom/start/end.
		const AssocElement = await createLocusZoomElement({
			observedAttrs: OBSERVED_ATTRS,
			buildDataSources: (LocusZoom) =>
				new LocusZoom.DataSources()
					.add('assoc', ['AssociationLZ', { url: `${LOCUSZOOM_API_BASE}statistic/single/`, source: 45 }])
					.add('ld', ['LDServer', { url: 'https://portaldev.sph.umich.edu/ld/', source: '1000G', build: 'GRCh37', population: 'ALL' }])
					.add('gene', ['GeneLZ', { url: `${LOCUSZOOM_API_BASE}annotation/genes/`, build: 'GRCh37' }])
					.add('recomb', ['RecombLZ', { url: `${LOCUSZOOM_API_BASE}annotation/recomb/results/`, build: 'GRCh37' }])
					.add('constraint', ['GeneConstraintLZ', { url: 'https://gnomad.broadinstitute.org/api/', build: 'GRCh37' }]),
			buildLayout: (LocusZoom, attrs) =>
				LocusZoom.Layouts.get('plot', 'standard_association', {
					state: { chr: attrs.chrom, start: Number(attrs.start), end: Number(attrs.end) },
				}),
		});

		if (!customElements.get(LOCUSZOOM_ASSOC_TAG)) {
			customElements.define(LOCUSZOOM_ASSOC_TAG, AssocElement);
		}
	}

	registry.register('locuszoom-assoc', {
		tag: LOCUSZOOM_ASSOC_TAG,
		domain: 'bio',
		title: 'GWAS Association Plot (LocusZoom)',
		description:
			'Renders an interactive regional association plot for a genomic locus: GWAS -log10(p-value) points colored by ' +
			'linkage disequilibrium (LD), a recombination-rate overlay, and a gene track for the region. Use this when the ' +
			'author wants to show the association signal and gene context around a specific locus (e.g. a GWAS hit or a ' +
			'gene of interest), not for genome-wide/multi-locus comparisons (see locuszoom-gwas-catalog) or ' +
			'phenome-wide comparisons at a single variant (see locuszoom-phewas).',
		schema: {
			chrom: {
				type: 'string',
				required: true,
				description: 'Chromosome name, without a "chr" prefix (e.g. "10").',
			},
			start: {
				type: 'number',
				required: true,
				description: 'Start position of the region to plot, in base pairs (GRCh37 coordinates).',
			},
			end: {
				type: 'number',
				required: true,
				description: 'End position of the region to plot, in base pairs (GRCh37 coordinates). Must be greater than start.',
			},
		},
	});
}
