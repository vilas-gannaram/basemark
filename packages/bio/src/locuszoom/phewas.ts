import LocusZoom from 'locuszoom';
import type { ComponentRegistry } from '@basemark/core';
import { createLocusZoomElement, LOCUSZOOM_API_BASE } from './shared';

export const LOCUSZOOM_PHEWAS_TAG = 'basemark-locuszoom-phewas';

const OBSERVED_ATTRS = ['variant'] as const;
const VARIANT_PATTERN = /^(\d+):(\d+)_[ACGT]+\/[ACGT]+$/;
const WINDOW_BP = 250_000;

function parseVariant(variant: string): { chrom: string; position: number } {
	const match = VARIANT_PATTERN.exec(variant);
	if (!match) {
		throw new Error(`Invalid variant "${variant}" — expected "chrom:position_ref/alt", e.g. "10:114758349_C/T".`);
	}
	return { chrom: match[1], position: Number(match[2]) };
}

// Verified against locuszoom@0.14.0's examples/phewas_scatter.html: centered
// on a single variant (not a region), with a fixed +/-250kb window — narrower
// scope than locuszoom-assoc/gwas-catalog, which take an explicit region.
const PhewasElement = createLocusZoomElement({
	observedAttrs: OBSERVED_ATTRS,
	buildDataSources: () =>
		new LocusZoom.DataSources()
			.add('phewas', ['PheWASLZ', { url: `${LOCUSZOOM_API_BASE}statistic/phewas/`, build: ['GRCh37'] }])
			.add('gene', ['GeneLZ', { url: `${LOCUSZOOM_API_BASE}annotation/genes/`, build: 'GRCh37' }])
			.add('constraint', ['GeneConstraintLZ', { url: 'https://gnomad.broadinstitute.org/api/', build: 'GRCh37' }]),
	buildLayout: (attrs) => {
		const { chrom, position } = parseVariant(attrs.variant);
		return LocusZoom.Layouts.get('plot', 'standard_phewas', {
			state: { variant: attrs.variant, chr: chrom, start: position - WINDOW_BP, end: position + WINDOW_BP },
		});
	},
});

export function registerPhewas(registry: ComponentRegistry): void {
	if (!customElements.get(LOCUSZOOM_PHEWAS_TAG)) {
		customElements.define(LOCUSZOOM_PHEWAS_TAG, PhewasElement);
	}
	registry.register('locuszoom-phewas', {
		tag: LOCUSZOOM_PHEWAS_TAG,
		domain: 'bio',
		title: 'Phenome-Wide Association Plot (LocusZoom PheWAS)',
		description:
			'Renders a phenome-wide association scan (PheWAS) for a single variant: -log10(p-value) across many ' +
			'phenotypes/traits, colored by trait category, plus a gene track for context. Use this when the author wants ' +
			'to show how one specific variant associates across many phenotypes — this is the inverse of ' +
			'locuszoom-assoc/locuszoom-gwas-catalog, which show many variants across one region for a single phenotype.',
		schema: {
			variant: {
				type: 'string',
				required: true,
				description:
					'Variant identifier as "chrom:position_ref/alt" (e.g. "10:114758349_C/T"). The plot is centered on this ' +
					'variant with a fixed +/-250kb window.',
			},
		},
	});
}
