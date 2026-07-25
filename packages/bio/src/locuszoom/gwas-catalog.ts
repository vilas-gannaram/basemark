import LocusZoom from 'locuszoom';
import type { ComponentRegistry } from '@basemark/core';
import { createLocusZoomElement, LOCUSZOOM_API_BASE } from './shared';

export const LOCUSZOOM_GWAS_CATALOG_TAG = 'basemark-locuszoom-gwas-catalog';

const OBSERVED_ATTRS = ['chrom', 'start', 'end'] as const;

// Verified against locuszoom@0.14.0's examples/gwas_catalog.html: same region
// props as the plain association plot, plus a `catalog` data source
// (GwasCatalogLZ) and the `association_catalog` layout, which overlays
// catalog-matched hits as labels on top of the association track.
const GwasCatalogElement = createLocusZoomElement({
	observedAttrs: OBSERVED_ATTRS,
	buildDataSources: () =>
		new LocusZoom.DataSources()
			.add('assoc', ['AssociationLZ', { url: `${LOCUSZOOM_API_BASE}statistic/single/`, source: 45 }])
			.add('ld', ['LDServer', { url: 'https://portaldev.sph.umich.edu/ld/', source: '1000G', population: 'ALL' }])
			.add('gene', ['GeneLZ', { url: `${LOCUSZOOM_API_BASE}annotation/genes/` }])
			.add('catalog', ['GwasCatalogLZ', { url: `${LOCUSZOOM_API_BASE}annotation/gwascatalog/results/` }])
			.add('recomb', ['RecombLZ', { url: `${LOCUSZOOM_API_BASE}annotation/recomb/results/` }])
			.add('constraint', ['GeneConstraintLZ', { url: 'https://gnomad.broadinstitute.org/api/', build: 'GRCh37' }]),
	buildLayout: (attrs) =>
		LocusZoom.Layouts.get('plot', 'association_catalog', {
			state: { chr: attrs.chrom, start: Number(attrs.start), end: Number(attrs.end), genome_build: 'GRCh37' },
		}),
});

export function registerGwasCatalog(registry: ComponentRegistry): void {
	if (!customElements.get(LOCUSZOOM_GWAS_CATALOG_TAG)) {
		customElements.define(LOCUSZOOM_GWAS_CATALOG_TAG, GwasCatalogElement);
	}
	registry.register('locuszoom-gwas-catalog', {
		tag: LOCUSZOOM_GWAS_CATALOG_TAG,
		domain: 'bio',
		title: 'GWAS Association Plot with Catalog Annotations (LocusZoom)',
		description:
			'Same regional association plot as locuszoom-assoc (points colored by LD, recombination-rate overlay, gene ' +
			'track), plus known significant hits from the NHGRI-EBI GWAS Catalog labeled directly on the plot. Use this ' +
			'when the author wants to relate a signal to previously published GWAS hits in the same region — prefer ' +
			"locuszoom-assoc if that catalog context isn't needed, since this adds an extra data source and can be busier.",
		schema: {
			chrom: {
				type: 'string',
				required: true,
				description: 'Chromosome name, without a "chr" prefix (e.g. "9").',
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
