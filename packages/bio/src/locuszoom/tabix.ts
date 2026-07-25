import LocusZoom from 'locuszoom';
import installTabixSource from 'locuszoom/esm/ext/lz-tabix-source';
import { install as installParsers, makeBed12Parser, makeGWASParser, makePlinkLdParser } from 'locuszoom/esm/ext/lz-parsers';
import installIntervalsTrack from 'locuszoom/esm/ext/lz-intervals-track';
import type { ComponentRegistry } from '@basemark/core';
import { createLocusZoomElement, LOCUSZOOM_API_BASE } from './shared';

// Order matters: lz-parsers' UserTabixLD adapter is only registered if
// lz-tabix-source has already been installed; lz-intervals-track supplies
// the `bed_intervals` panel used below. Mirrors the script load order in
// examples/ext/tabix_tracks.html.
LocusZoom.use(installTabixSource);
LocusZoom.use(installParsers);
LocusZoom.use(installIntervalsTrack);

export const LOCUSZOOM_TABIX_TAG = 'basemark-locuszoom-tabix';

const OBSERVED_ATTRS = ['chrom', 'start', 'end'] as const;

// Verified live: these are LocusZoom's own tabix-demo files (GIANT BMI
// meta-analysis, an LD panel, and a chromatin accessibility BED track),
// confirmed reachable with CORS + Range support via an in-browser fetch()
// before wiring this up. Verified against
// locuszoom@0.14.0's examples/ext/tabix_tracks.html.
const TABIX_DEMO_BASE = 'https://locuszoom-web-demos.s3.us-east-2.amazonaws.com/tabix-demo/';

const gwasParser = makeGWASParser({
	chrom_col: 1,
	pos_col: 2,
	ref_col: 4,
	alt_col: 5,
	pvalue_col: 6,
	is_neg_log_pvalue: true,
	beta_col: 7,
	stderr_beta_col: 8,
});
const bedParser = makeBed12Parser({ normalize: true });
const ldParser = makePlinkLdParser({ normalize: true });

const TabixElement = createLocusZoomElement({
	observedAttrs: OBSERVED_ATTRS,
	buildDataSources: () =>
		new LocusZoom.DataSources()
			.add('assoc', ['TabixUrlSource', { url_data: `${TABIX_DEMO_BASE}gwas_giant-bmi_meta_women-only.gz`, parser_func: gwasParser, overfetch: 0 }])
			.add('ld', ['UserTabixLD', { url_data: `${TABIX_DEMO_BASE}plink.ld.tab.gz`, parser_func: ldParser }])
			.add('recomb', ['RecombLZ', { url: `${LOCUSZOOM_API_BASE}annotation/recomb/results/`, build: 'GRCh37' }])
			.add('intervals', ['TabixUrlSource', { url_data: `${TABIX_DEMO_BASE}DFF622JQK.bed.bgz`, parser_func: bedParser, overfetch: 0.25 }])
			.add('gene', ['GeneLZ', { url: `${LOCUSZOOM_API_BASE}annotation/genes/`, build: 'GRCh37' }])
			.add('constraint', ['GeneConstraintLZ', { url: 'https://gnomad.broadinstitute.org/api/', build: 'GRCh37' }]),
	buildLayout: (attrs) =>
		LocusZoom.Layouts.get('plot', 'standard_association', {
			state: { chr: attrs.chrom, start: Number(attrs.start), end: Number(attrs.end) },
			panels: [
				LocusZoom.Layouts.get('panel', 'association', { title: { text: 'GIANT BMI meta-analysis (women only)' } }),
				LocusZoom.Layouts.get('panel', 'bed_intervals', { title: { text: 'Accessible chromatin (ChIP - Pancreatic Islets)' } }),
				LocusZoom.Layouts.get('panel', 'genes'),
			],
		}),
});

export function registerTabix(registry: ComponentRegistry): void {
	if (!customElements.get(LOCUSZOOM_TABIX_TAG)) {
		customElements.define(LOCUSZOOM_TABIX_TAG, TabixElement);
	}
	registry.register('locuszoom-tabix', {
		tag: LOCUSZOOM_TABIX_TAG,
		domain: 'bio',
		title: 'Association Plot from Tabix-Indexed Files (LocusZoom)',
		description:
			'Regional association plot (GIANT BMI meta-analysis, women only) plus a chromatin-accessibility interval ' +
			'track and gene track, with the association/LD/intervals data all read directly from bgzipped, ' +
			'tabix-indexed files rather than a REST API — demonstrates the file-based data path instead of the ' +
			'API-backed one used by locuszoom-assoc. Use this only for the fixed BMI/chromatin demo dataset baked into ' +
			'the component; prefer locuszoom-assoc for a general region/GWAS plot.',
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
