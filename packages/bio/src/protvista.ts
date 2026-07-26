import 'protvista-uniprot';
import type { ComponentRegistry } from '@basemark/core';

export const PROTVISTA_TAG = 'basemark-protvista';

// Scoped to this element's own shadow root, same reasoning as structure.ts —
// theme custom properties (--border, --radius, --card) still inherit in from
// @basemark/core's theme.css despite the boundary. protvista-uniprot attaches
// its own shadow root internally too; nesting shadow roots is fine, and theme
// custom properties keep inheriting through both levels.
const STYLES = `
	:host {
		display: block;
		box-sizing: border-box;
		margin: 1.5rem 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.75rem;
		background: var(--card);
		font-family: var(--font-sans);
	}
`;

// protvista-uniprot's own connectedCallback only starts its data fetch if
// `accession` is already present at connection time — there's no reactive
// branch that retries later if it arrives after. Our generic React wrapper
// (@lit/react's createComponent) sets properties after inserting the element
// into the DOM, which misses that window and leaves the component stuck in a
// permanent loading state (verified: no fetch to EBI ever fires). Same fix
// as structure.ts: our own thin wrapper creates the inner element and sets
// its attribute BEFORE appending it, so protvista-uniprot's connectedCallback
// always sees `accession` already set — regardless of how/when our own
// wrapper's attribute got set by whatever's rendering it (React, vanilla DOM,
// etc.).
class ProtvistaElement extends HTMLElement {
	static get observedAttributes(): string[] {
		return ['accession'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback(): void {
		this.render();
	}

	attributeChangedCallback(): void {
		if (this.isConnected) this.render();
	}

	private render(): void {
		const accession = this.getAttribute('accession');
		if (!accession) return;

		const root = this.shadowRoot as ShadowRoot;
		root.innerHTML = `<style>${STYLES}</style>`;
		const viewer = document.createElement('protvista-uniprot');
		viewer.setAttribute('accession', accession);
		root.appendChild(viewer);
	}
}

export function registerProtvista(registry: ComponentRegistry): void {
	if (!customElements.get(PROTVISTA_TAG)) {
		customElements.define(PROTVISTA_TAG, ProtvistaElement);
	}
	registry.register('protvista', {
		tag: PROTVISTA_TAG,
		domain: 'bio',
		title: 'Protein Sequence & Feature Viewer (ProtVista/UniProt)',
		description:
			'Renders UniProt sequence, domain, and feature tracks (variants, PTMs, structural coverage, etc.) for a ' +
			'protein. Use this when the author wants to show sequence-level annotation for a specific UniProt entry, ' +
			'not a 3D structure (see structure) or a single-variant/genomic-locus view (see the locuszoom-* components).',
		schema: {
			accession: {
				type: 'string',
				required: true,
				description: 'A UniProt accession (e.g. "P05067").',
			},
		},
	});
}
