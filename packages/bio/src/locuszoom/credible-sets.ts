import type { ComponentRegistry } from '@basemark/core';
import { createLocusZoomElement, LOCUSZOOM_API_BASE } from './shared';

export const LOCUSZOOM_CREDIBLE_SETS_TAG = 'basemark-locuszoom-credible-sets';

const OBSERVED_ATTRS = ['chrom', 'start', 'end'] as const;

// async — see shared.ts. Element + LocusZoom.use() plugin install both need
// a real `LocusZoom` value, so both move inside the guarded function.
export async function registerCredibleSets(registry: ComponentRegistry): Promise<void> {
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		const [{ default: LocusZoom }, { default: installCredibleSets }] = await Promise.all([
			import('locuszoom'),
			import('locuszoom/esm/ext/lz-credible-sets'),
		]);
		LocusZoom.use(installCredibleSets);

		// Verified against locuszoom@0.14.0's examples/ext/credible_sets.html.
		const CredibleSetsElement = await createLocusZoomElement({
			observedAttrs: OBSERVED_ATTRS,
			buildDataSources: () =>
				new LocusZoom.DataSources()
					.add('assoc', ['AssociationLZ', { url: `${LOCUSZOOM_API_BASE}statistic/single/`, source: 45 }])
					.add('credset', ['CredibleSetLZ', { threshold: 0.95, significance_threshold: 7.301 }])
					.add('ld', ['LDServer', { url: 'https://portaldev.sph.umich.edu/ld/', source: '1000G', build: 'GRCh37', population: 'ALL' }])
					.add('gene', ['GeneLZ', { url: `${LOCUSZOOM_API_BASE}annotation/genes/`, build: 'GRCh37' }])
					.add('recomb', ['RecombLZ', { url: `${LOCUSZOOM_API_BASE}annotation/recomb/results/`, build: 'GRCh37' }])
					.add('constraint', ['GeneConstraintLZ', { url: 'https://gnomad.broadinstitute.org/api/', build: 'GRCh37' }]),
			buildLayout: (_LocusZoom, attrs) =>
				LocusZoom.Layouts.get('plot', 'association_credible_set', {
					state: { chr: attrs.chrom, start: Number(attrs.start), end: Number(attrs.end) },
				}),
		});

		if (!customElements.get(LOCUSZOOM_CREDIBLE_SETS_TAG)) {
			customElements.define(LOCUSZOOM_CREDIBLE_SETS_TAG, CredibleSetsElement);
		}
	}

	registry.register('locuszoom-credible-sets', {
		tag: LOCUSZOOM_CREDIBLE_SETS_TAG,
		domain: 'bio',
		title: '95% Credible Set Association Plot (LocusZoom)',
		description:
			'Regional association plot that computes and highlights the 95% Bayesian credible set of likely-causal ' +
			'variants for the locus (derived from the association p-values themselves, using a fixed genome-wide ' +
			'significance threshold), alongside LD, recombination rate, and gene tracks. Use this when the author wants ' +
			'to narrow a signal down to its most probable causal variants, not just show the raw association — prefer ' +
			'locuszoom-assoc for a plain signal plot without that statistical layer.',
		schema: {
			chrom: {
				type: 'string',
				required: true,
				description: 'Chromosome name, without a "chr" prefix (e.g. "16").',
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
