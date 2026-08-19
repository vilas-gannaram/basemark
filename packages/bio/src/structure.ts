// Side-effect import required — a downstream consumer's own tsc run never
// discovers './3dmol''s ambient .d.ts otherwise (only this package's tsconfig globs it).
import './3dmol';
import type { ComponentRegistry } from '@basemark/core';

export const STRUCTURE_TAG = 'basemark-structure';
const STRUCTURE_HEIGHT_PX = 620;

// :host styling is scoped to this shadow root, can't leak or be reached into.
// Theme tokens still arrive via inheritance — see @basemark/core's theme.css.
const STYLES = `
	:host {
		display: block;
		box-sizing: border-box;
		height: ${STRUCTURE_HEIGHT_PX}px;
		max-height: ${STRUCTURE_HEIGHT_PX}px;
		margin: 1.5rem 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.75rem;
		background: var(--card);
		color: var(--card-foreground);
		font-family: var(--font-sans);
	}
	.viewer {
		width: 100%;
		height: 100%;
		position: relative;
	}
`;

// 3Dmol.js's core build (not `.ui`), not pdbe-molstar — a bare WebGL
// renderer with no chrome, since the goal is rendering, not a full tool.
// async — 3Dmol.js touches `window` at module scope, so the import is deferred and awaited first.
export async function registerStructure(registry: ComponentRegistry): Promise<void> {
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		const { createViewer, download } = await import('3dmol/build/3Dmol.es6.js');

		class StructureElement extends HTMLElement {
			static get observedAttributes(): string[] {
				return ['pdbid'];
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
				const pdbId = this.getAttribute('pdbid');
				if (!pdbId) return;

				const root = this.shadowRoot as ShadowRoot;
				root.innerHTML = `<style>${STYLES}</style>`;

				// 3Dmol.js sizes its canvas off the container element passed to
				// createViewer, not an ancestor's — the :host rule above gives this
				// element (and so `.viewer`'s 100%) an explicit height to size against.
				const container = document.createElement('div');
				container.className = 'viewer';
				root.appendChild(container);

				const viewer = createViewer(container, { backgroundColor: 'white' });
				if (!viewer) return;
				download(`pdb:${pdbId}`, viewer, {}, () => {
					viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
					viewer.zoomTo();
					viewer.render();
				});
			}
		}

		if (!customElements.get(STRUCTURE_TAG)) {
			customElements.define(STRUCTURE_TAG, StructureElement);
		}
	}

	registry.register('structure', {
		tag: STRUCTURE_TAG,
		domain: 'bio',
		title: '3D Protein Structure Viewer (3Dmol.js)',
		description:
			'Renders an interactive 3D viewer for a protein structure from the PDB, via 3Dmol.js. Use this when the ' +
			'author wants to show a specific solved/predicted 3D structure, not sequence-level annotation (see protvista) ' +
			'or a genomic-locus view (see the locuszoom-* components).',
		schema: {
			pdbid: {
				type: 'string',
				required: true,
				description: 'A 4-character PDB entry ID (e.g. "1cbs").',
			},
		},
	});
}
