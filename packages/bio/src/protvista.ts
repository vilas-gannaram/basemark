import 'protvista-uniprot';
import type { ComponentRegistry } from '@basemark/core';

export const PROTVISTA_TAG = 'basemark-protvista';

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

	connectedCallback(): void {
		this.render();
	}

	attributeChangedCallback(): void {
		if (this.isConnected) this.render();
	}

	private render(): void {
		const accession = this.getAttribute('accession');
		if (!accession) return;

		this.innerHTML = '';
		const viewer = document.createElement('protvista-uniprot');
		viewer.setAttribute('accession', accession);
		this.appendChild(viewer);
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
