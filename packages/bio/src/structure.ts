import './3dmol';
import { createViewer, download } from '3dmol/build/3Dmol.es6.js';
import type { ComponentRegistry } from '@basemark/core';

export const STRUCTURE_TAG = 'basemark-structure';
const STRUCTURE_HEIGHT_PX = 620;

// 3Dmol.js instead of pdbe-molstar (used earlier): pdbe-molstar ships a full
// Mol* application — toolbar, Structure Tools panel, Quick Styles, save
// PNG/SVG — when the goal here is just rendering the structure, not
// providing a tool. 3Dmol.js's core build (not the `.ui` variant) is a bare
// WebGL renderer with no chrome, and its own `download('pdb:{id}', ...)`
// helper fetches straight from RCSB (with a bcif→pdb fallback built in), so
// this stays Tier 1 — no fetch/parse logic needed on our side.
class StructureElement extends HTMLElement {
	static get observedAttributes(): string[] {
		return ['pdbid'];
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

		this.innerHTML = '';
		// 3Dmol.js sizes its canvas off the container element passed to
		// createViewer, not an ancestor's — without an explicit height here it
		// collapses to zero, since neither this element nor its container has
		// any other height to inherit from.
		this.style.display = 'block';
		this.style.height = `${STRUCTURE_HEIGHT_PX}px`;
		this.style.maxHeight = `${STRUCTURE_HEIGHT_PX}px`;

		const container = document.createElement('div');
		container.style.width = '100%';
		container.style.height = '100%';
		container.style.position = 'relative';
		this.appendChild(container);

		const viewer = createViewer(container, { backgroundColor: 'white' });
		if (!viewer) return;
		download(`pdb:${pdbId}`, viewer, {}, () => {
			viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
			viewer.zoomTo();
			viewer.render();
		});
	}
}

export function registerStructure(registry: ComponentRegistry): void {
	if (!customElements.get(STRUCTURE_TAG)) {
		customElements.define(STRUCTURE_TAG, StructureElement);
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
