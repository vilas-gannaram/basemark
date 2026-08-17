// './protvista-uniprot' is an ambient .d.ts (declare module 'protvista-uniprot'
// — see that file). This side-effect import is required, not just belt-and-
// suspenders: a downstream consumer with its own separate `tsc` run (e.g.
// examples/vanilla, whose tsconfig only globs its own "src") never discovers
// an ambient declaration file that nothing actually imports — only this
// package's own tsconfig happens to glob-include it directly.
import './protvista-uniprot';
import type { ComponentRegistry } from '@basemark/core';

export const PROTVISTA_TAG = 'basemark-protvista';

// No shadow root here — deliberately, unlike every other bio component.
// protvista-uniprot itself renders into light DOM, not its own shadow root
// (its source: "we are not using shadowDOM because of Mol*"), and it injects
// the stylesheet its tracks/categories depend on via a plain <style> appended
// to `document.head`. If we put it inside our own shadow root (as this
// component used to), that page-level stylesheet can never reach it — shadow
// DOM encapsulation blocks outside author styles from crossing in, same as it
// blocks inside styles from leaking out. The visible symptom: category labels
// render as plain unstyled text and no track/feature graphics ever draw,
// while the Mol* structure viewer at the bottom still works fine (it draws to
// a canvas, no CSS dependency). So this wrapper sets its own chrome as plain
// inline styles on the host element itself, in the same light-DOM/document
// style scope protvista-uniprot expects to be rendered into.
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
// registerProtvista is async, unlike @basemark/common's register* functions
// — protvista-uniprot (imported below) touches `HTMLElement` at its own
// module scope, same problem AGENTS.md's guard note covers for a class
// declared directly here, so it can't be a plain top-level import either.
// Deferred to a dynamic import, awaited before ProtvistaElement is declared
// (it calls `document.createElement('protvista-uniprot')` in render(),
// which needs that tag already defined) and before customElements.define()
// — both DOM-only operations, gated by the same guard as the class itself.
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
