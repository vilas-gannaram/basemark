import type { ComponentRegistry } from '@basemark/core';

export const GENOME_BROWSER_TAG = 'basemark-genome-browser';
const GENOME_BROWSER_HEIGHT_PX = 500;
const DEFAULT_GENOME = 'hg38';

// :host styling scoped to this shadow root — theme tokens still inherit in.
const STYLES = `
	:host {
		display: block;
		box-sizing: border-box;
		height: ${GENOME_BROWSER_HEIGHT_PX}px;
		overflow-y: auto;
		margin: 1.5rem 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.75rem;
		background: var(--card);
		color: var(--card-foreground);
		font-family: var(--font-sans);
	}
	.browser {
		width: 100%;
	}
`;

// Shadow root works here, confirmed — igv.js takes a real element reference,
// not a global ID selector (unlike LocusZoom's d3.select('div#'+id)).
//
// async — igv touches `document` at module scope (confirmed crash under
// plain Node), so the import is deferred and awaited first.
export async function registerGenomeBrowser(registry: ComponentRegistry): Promise<void> {
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		const { default: igv } = await import('igv');

		class GenomeBrowserElement extends HTMLElement {
			static get observedAttributes(): string[] {
				return ['locus', 'genome'];
			}

			private browser?: Awaited<ReturnType<typeof igv.createBrowser>>;
			private resizeObserver?: ResizeObserver;

			constructor() {
				super();
				this.attachShadow({ mode: 'open' });
			}

			connectedCallback(): void {
				void this.render();
			}

			attributeChangedCallback(): void {
				if (this.isConnected) void this.render();
			}

			disconnectedCallback(): void {
				this.resizeObserver?.disconnect();
				if (this.browser) igv.removeBrowser(this.browser);
			}

			private async render(): Promise<void> {
				const locus = this.getAttribute('locus');
				if (!locus) return;
				const genome = this.getAttribute('genome') ?? DEFAULT_GENOME;

				const root = this.shadowRoot as ShadowRoot;
				root.innerHTML = `<style>${STYLES}</style><div class="browser"></div>`;
				const container = root.querySelector('.browser') as HTMLElement;

				if (this.browser) igv.removeBrowser(this.browser);
				this.browser = await igv.createBrowser(container, { genome, locus });

				// No explicit resize() on Browser — visibilityChange() is igv's own
				// documented hook for "this instance became visible/its size changed".
				this.resizeObserver?.disconnect();
				this.resizeObserver = new ResizeObserver(() => this.browser?.visibilityChange());
				this.resizeObserver.observe(container);
			}
		}

		if (!customElements.get(GENOME_BROWSER_TAG)) {
			customElements.define(GENOME_BROWSER_TAG, GenomeBrowserElement);
		}
	}

	registry.register('genome-browser', {
		tag: GENOME_BROWSER_TAG,
		domain: 'bio',
		title: 'Genome Browser (IGV.js)',
		description:
			'Renders a scrollable/zoomable genome-browser view of a locus — reference sequence plus the default gene ' +
			'annotation track, via IGV.js. Use this when the author wants to browse what is actually at a region, not a ' +
			'single plot type — for a GWAS association plot see the locuszoom-* components; for a 3D structure see ' +
			"structure. Only IGV.js's built-in reference genomes are supported (no custom track URLs) — see this " +
			"package's README.",
		schema: {
			locus: {
				type: 'string',
				required: true,
				description: 'Genomic region as "chrom:start-end", e.g. "chr7:140753336-140763336".',
			},
			genome: {
				type: 'string',
				description: `One of IGV.js's built-in genome IDs (e.g. "hg38", "hg19", "mm39"). Defaults to "${DEFAULT_GENOME}".`,
			},
		},
	});
}
