// './3dmol' is an ambient .d.ts (declare module '3dmol/build/3Dmol.es6.js'
// — see that file). This side-effect import is required, not just belt-and-
// suspenders: a downstream consumer with its own separate `tsc` run (e.g.
// examples/vanilla, whose tsconfig only globs its own "src") never discovers
// an ambient declaration file that nothing actually imports — only this
// package's own tsconfig happens to glob-include it directly.
import './3dmol';
import type { ComponentRegistry } from '@basemark/core';

export const STRUCTURE_TAG = 'basemark-structure';
const STRUCTURE_HEIGHT_PX = 620;

// :host styling is scoped to this element's own shadow root — it can't leak
// onto the host page, and the host page's own CSS (resets, MUI/AntD
// baselines, etc.) can't reach in and distort it. Theme values (--border,
// --radius, --card) still arrive via inheritance: CSS custom properties
// cross shadow boundaries even though ordinary rules don't (see @basemark/core's
// theme.css).
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

// 3Dmol.js instead of pdbe-molstar (used earlier): pdbe-molstar ships a full
// Mol* application — toolbar, Structure Tools panel, Quick Styles, save
// PNG/SVG — when the goal here is just rendering the structure, not
// providing a tool. 3Dmol.js's core build (not the `.ui` variant) is a bare
// WebGL renderer with no chrome, and its own `download('pdb:{id}', ...)`
// helper fetches straight from RCSB (with a bcif→pdb fallback built in), so
// this stays Tier 1 — no fetch/parse logic needed on our side.
// registerStructure is async, unlike @basemark/common's register* functions
// — 3Dmol.js (imported below) touches `window` at its own module scope, same
// problem AGENTS.md's guard note covers for a class declared directly here,
// so it can't be a plain top-level import either. Deferred to a dynamic
// import, awaited before StructureElement is declared (its render() closes
// over createViewer/download) and before customElements.define() — both
// DOM-only operations, gated by the same guard as the class itself.
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
