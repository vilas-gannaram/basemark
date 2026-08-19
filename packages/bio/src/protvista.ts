// Side-effect import required — a downstream consumer's own tsc run never
// discovers './protvista-uniprot''s ambient .d.ts otherwise (only this package's tsconfig globs it).
import './protvista-uniprot';
import type { ComponentRegistry } from '@basemark/core';

export const PROTVISTA_TAG = 'basemark-protvista';

// No shadow root, deliberately — protvista-uniprot injects its own required
// stylesheet into document.head, which a shadow root would block from
// reaching in (symptom: unstyled labels, no track graphics). Chrome is inline styles on the host instead.
const HOST_STYLE: Partial<CSSStyleDeclaration> = {
	display: 'block',
	boxSizing: 'border-box',
	margin: '1.5rem 0',
	border: '1px solid var(--border)',
	borderRadius: 'var(--radius)',
	padding: '0.75rem',
	background: 'var(--card)',
	color: 'var(--card-foreground)',
	fontFamily: 'var(--font-sans)',
};

// protvista-uniprot only fetches if `accession` is set before connection —
// no retry if it arrives later (verified: React's createComponent sets props
// after insert, leaving it stuck loading). render() sets the attribute before appending, fixing this.
// async — protvista-uniprot touches `HTMLElement` at module scope, so the import is deferred and awaited first.
export async function registerProtvista(registry: ComponentRegistry): Promise<void> {
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		await import('protvista-uniprot');

		class ProtvistaElement extends HTMLElement {
			static get observedAttributes(): string[] {
				return ['accession'];
			}

			connectedCallback(): void {
				Object.assign(this.style, HOST_STYLE);
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

		if (!customElements.get(PROTVISTA_TAG)) {
			customElements.define(PROTVISTA_TAG, ProtvistaElement);
		}
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
