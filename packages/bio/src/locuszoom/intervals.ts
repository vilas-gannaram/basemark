import type { ComponentRegistry } from '@basemark/core';
import { createLocusZoomElement, LOCUSZOOM_API_BASE } from './shared';

export const LOCUSZOOM_INTERVALS_TAG = 'basemark-locuszoom-intervals';

const OBSERVED_ATTRS = ['chrom', 'start', 'end'] as const;

// async — see shared.ts. Element + LocusZoom.use() plugin install both need
// a real `LocusZoom` value, so both move inside the guarded function.
export async function registerIntervals(registry: ComponentRegistry): Promise<void> {
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		const [{ default: LocusZoom }, { default: installIntervalsTrack }] = await Promise.all([
			import('locuszoom'),
			import('locuszoom/esm/ext/lz-intervals-track'),
		]);
		LocusZoom.use(installIntervalsTrack);

		// Verified against locuszoom@0.14.0's examples/ext/interval_annotations.html.
		// `constraint` isn't in that demo but is required here — throws without it (version drift).
		const IntervalsElement = await createLocusZoomElement({
			observedAttrs: OBSERVED_ATTRS,
			buildDataSources: () =>
				new LocusZoom.DataSources()
					.add('assoc', ['AssociationLZ', { url: `${LOCUSZOOM_API_BASE}statistic/single/`, source: 45 }])
					.add('ld', ['LDServer', { url: 'https://portaldev.sph.umich.edu/ld/', source: '1000G', build: 'GRCh37', population: 'ALL' }])
					.add('gene', ['GeneLZ', { url: `${LOCUSZOOM_API_BASE}annotation/genes/`, build: 'GRCh37' }])
					.add('recomb', ['RecombLZ', { url: `${LOCUSZOOM_API_BASE}annotation/recomb/results/`, build: 'GRCh37' }])
					.add('intervals', ['IntervalLZ', { url: `${LOCUSZOOM_API_BASE}annotation/intervals/results/`, source: 19 }])
					.add('constraint', ['GeneConstraintLZ', { url: 'https://gnomad.broadinstitute.org/api/', build: 'GRCh37' }]),
			buildLayout: (_LocusZoom, attrs) =>
				LocusZoom.Layouts.get('plot', 'interval_association', {
					state: { chr: attrs.chrom, start: Number(attrs.start), end: Number(attrs.end) },
				}),
		});

		if (!customElements.get(LOCUSZOOM_INTERVALS_TAG)) {
			customElements.define(LOCUSZOOM_INTERVALS_TAG, IntervalsElement);
		}
	}

	registry.register('locuszoom-intervals', {
		tag: LOCUSZOOM_INTERVALS_TAG,
		domain: 'bio',
		title: 'GWAS Association Plot with Interval Annotations (LocusZoom)',
		description:
			'Same regional association plot as locuszoom-assoc (LD-colored points, recombination-rate overlay, gene ' +
			'track), plus an interval annotation track showing labeled genomic regions (e.g. chromatin states, regulatory ' +
			'elements) beneath the association points. Use this when the author wants to relate an association signal ' +
			'to annotated functional regions in the same locus — prefer locuszoom-assoc if that annotation track ' +
			"isn't needed.",
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
