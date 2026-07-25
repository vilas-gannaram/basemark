import './locuszoom';
import LocusZoom from 'locuszoom';
import 'locuszoom/dist/locuszoom.css';
import type { ComponentRegistry } from '@basemark/core';

export const LOCUSZOOM_ASSOC_TAG = 'basemark-locuszoom-assoc';

const API_BASE = 'https://portaldev.sph.umich.edu/api/v1/';
let plotIdCounter = 0;

// Mirrors the data sources used by LocusZoom's own standard association demo
// (region 10:114550452-115067678, T2D GWAS meta-analysis, source id 45) —
// verified against locuszoom@0.14.0's `index.html`. This is the whole point
// of the Tier-2 design: the layout and sources are fixed inside the
// component, and the directive only ever exposes chrom/start/end.
function createDataSources() {
	return new LocusZoom.DataSources()
		.add('assoc', ['AssociationLZ', { url: `${API_BASE}statistic/single/`, source: 45 }])
		.add('ld', ['LDServer', { url: 'https://portaldev.sph.umich.edu/ld/', source: '1000G', build: 'GRCh37', population: 'ALL' }])
		.add('gene', ['GeneLZ', { url: `${API_BASE}annotation/genes/`, build: 'GRCh37' }])
		.add('recomb', ['RecombLZ', { url: `${API_BASE}annotation/recomb/results/`, build: 'GRCh37' }])
		.add('constraint', ['GeneConstraintLZ', { url: 'https://gnomad.broadinstitute.org/api/', build: 'GRCh37' }]);
}

class LocusZoomAssocElement extends HTMLElement {
	static get observedAttributes(): string[] {
		return ['chrom', 'start', 'end'];
	}

	connectedCallback(): void {
		this.render();
	}

	attributeChangedCallback(): void {
		if (this.isConnected) this.render();
	}

	private render(): void {
		const chrom = this.getAttribute('chrom');
		const start = Number(this.getAttribute('start'));
		const end = Number(this.getAttribute('end'));
		if (!chrom || Number.isNaN(start) || Number.isNaN(end)) return;

		this.innerHTML = '';
		const container = document.createElement('div');
		// LocusZoom.populate requires the target element to already have a
		// non-empty `id` — its own auto-id fallback only triggers when
		// `element.id` is `undefined`, which never happens for a real DOM node.
		container.id = `basemark-locuszoom-${plotIdCounter++}`;
		container.className = 'lz-container-responsive';
		this.appendChild(container);

		const layout = LocusZoom.Layouts.get('plot', 'standard_association', {
			state: { chr: chrom, start, end },
		});
		LocusZoom.populate(container, createDataSources(), layout);
	}
}

export function registerBioComponents(registry: ComponentRegistry): void {
	if (!customElements.get(LOCUSZOOM_ASSOC_TAG)) {
		customElements.define(LOCUSZOOM_ASSOC_TAG, LocusZoomAssocElement);
	}
	registry.register('locuszoom-assoc', {
		tag: LOCUSZOOM_ASSOC_TAG,
		title: 'GWAS Association Plot (LocusZoom)',
		description:
			'Renders an interactive regional association plot for a genomic locus: GWAS -log10(p-value) points colored by ' +
			'linkage disequilibrium (LD), a recombination-rate overlay, and a gene track for the region. Use this when the ' +
			'author wants to show the association signal and gene context around a specific locus (e.g. a GWAS hit or a ' +
			'gene of interest), not for genome-wide or multi-locus comparisons.',
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
