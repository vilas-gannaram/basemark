import LocusZoom from 'locuszoom';
import type { ComponentRegistry } from '@basemark/core';
import { createLocusZoomElement, LOCUSZOOM_API_BASE } from './shared';

export const LOCUSZOOM_MULTI_PHENO_TAG = 'basemark-locuszoom-multi-pheno';

const OBSERVED_ATTRS = ['chrom', 'start', 'end'] as const;

// Verified against locuszoom@0.14.0's examples/multiple_phenotypes_layered.html:
// four fixed metabolic-trait GWAS (real UMich study IDs), each its own
// AssociationLZ source, layered as separate colored data layers on one
// association panel — not a preset layout, built up manually like the demo
// does. The phenotype list itself is intentionally fixed (Tier 2: the
// directive only ever exposes chrom/start/end), not an author-supplied list.
const PHENOTYPES = [
	{ namespace: 'fasting_glucose', title: 'Fasting glucose meta-analysis', color: 'rgb(212, 63, 58)', studyId: 31 },
	{ namespace: 'fasting_insulin', title: 'Fasting insulin meta-analysis', color: 'rgb(238, 162, 54)', studyId: 32 },
	{ namespace: 'triglycerides', title: 'Triglycerides meta-analysis', color: 'rgb(92, 184, 92)', studyId: 29 },
	{ namespace: 'cholesterol', title: 'Total cholesterol meta-analysis', color: 'rgb(53, 126, 189)', studyId: 30 },
] as const;

function buildDataSources() {
	const sources = new LocusZoom.DataSources()
		.add('recomb', ['RecombLZ', { url: `${LOCUSZOOM_API_BASE}annotation/recomb/results/`, build: 'GRCh37' }])
		.add('gene', ['GeneLZ', { url: `${LOCUSZOOM_API_BASE}annotation/genes/`, build: 'GRCh37' }])
		.add('constraint', ['GeneConstraintLZ', { url: 'https://gnomad.broadinstitute.org/api/', build: 'GRCh37' }]);
	for (const pheno of PHENOTYPES) {
		sources.add(pheno.namespace, ['AssociationLZ', { url: `${LOCUSZOOM_API_BASE}statistic/single/`, source: pheno.studyId }]);
	}
	return sources;
}

function buildLayout(attrs: Record<(typeof OBSERVED_ATTRS)[number], string>): Record<string, unknown> {
	const associationPanel = LocusZoom.Layouts.get('panel', 'association', {
		data_layers: [
			LocusZoom.Layouts.get('data_layer', 'significance', { name: 'Line of GWAS Significance' }),
			LocusZoom.Layouts.get('data_layer', 'recomb_rate', { namespace: { recomb: 'recomb' }, name: 'Recombination Rate' }),
		],
	});
	const dataLayers = associationPanel.data_layers as Record<string, unknown>[];

	for (const pheno of PHENOTYPES) {
		const layer = LocusZoom.Layouts.get('data_layer', 'association_pvalues', {
			id: `associationpvalues_${pheno.namespace}`,
			name: pheno.title,
			point_shape: 'circle',
			point_size: 40,
			color: pheno.color,
			legend: [{ shape: 'circle', color: pheno.color, size: 40, label: pheno.title, class: 'lz-data_layer-scatter' }],
		});
		// Overrides merge namespaces rather than replace them, so LD would
		// still show up unless we clear it explicitly here (mirrors the demo's
		// own comment on this exact issue).
		layer.namespace = { assoc: pheno.namespace };
		layer.data_operations = [];
		dataLayers.push(layer);
	}

	return {
		width: 800,
		responsive_resize: true,
		state: { chr: attrs.chrom, start: Number(attrs.start), end: Number(attrs.end) },
		panels: [associationPanel, LocusZoom.Layouts.get('panel', 'genes', { namespace: { gene: 'gene' } })],
		toolbar: LocusZoom.Layouts.get('toolbar', 'standard_plot'),
	};
}

const MultiPhenoElement = createLocusZoomElement({
	observedAttrs: OBSERVED_ATTRS,
	buildDataSources,
	buildLayout,
});

export function registerMultiPheno(registry: ComponentRegistry): void {
	if (!customElements.get(LOCUSZOOM_MULTI_PHENO_TAG)) {
		customElements.define(LOCUSZOOM_MULTI_PHENO_TAG, MultiPhenoElement);
	}
	registry.register('locuszoom-multi-pheno', {
		tag: LOCUSZOOM_MULTI_PHENO_TAG,
		domain: 'bio',
		title: 'Layered Multi-Phenotype Association Plot (LocusZoom)',
		description:
			'Overlays association signals for four related metabolic-trait GWAS (fasting glucose, fasting insulin, ' +
			'triglycerides, total cholesterol — each a real published meta-analysis) as differently colored point layers ' +
			'on one association panel, with a shared gene track. Use this when the author wants to compare whether a ' +
			'locus affects several correlated metabolic phenotypes at once — for a single phenotype, use locuszoom-assoc ' +
			'instead. The phenotype set is fixed and cannot be changed via props.',
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
