import type { ComponentRegistry } from '@basemark/core';

export const INTERACTION_NETWORK_TAG = 'basemark-interaction-network';

// STRING's own image API — a fixed, well-known host, not a caller-supplied
// URL, same reasoning as pathway.ts's KEGG endpoint. `identifiers` takes
// multiple genes separated by a carriage return (%0d), per STRING's API docs.
const STRING_IMAGE_BASE = 'https://string-db.org/api/image/network';
const DEFAULT_SPECIES = 9606; // human

const STYLES = `
	:host {
		display: block;
		box-sizing: border-box;
		margin: 1.5rem 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.75rem;
		background: var(--card);
		color: var(--card-foreground);
		font-family: var(--font-sans);
	}
	.title {
		margin: 0 0 0.5rem;
		font-weight: 600;
	}
	img {
		display: block;
		max-width: 100%;
		height: auto;
		background: white;
		border-radius: 2px;
	}
	.error {
		color: var(--destructive, #dc2626);
		font-size: 0.875rem;
	}
`;

function escapeHtml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Leaf directive — Tier 2, a couple of short fields (ARCH §2).
export async function registerInteractionNetwork(registry: ComponentRegistry): Promise<void> {
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		class InteractionNetworkElement extends HTMLElement {
			static get observedAttributes(): string[] {
				return ['gene', 'species', 'title'];
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
				const geneAttr = this.getAttribute('gene');
				if (!geneAttr) return;
				const species = this.getAttribute('species') ?? String(DEFAULT_SPECIES);
				const title = this.getAttribute('title');

				const genes = geneAttr
					.split(',')
					.map((gene) => gene.trim())
					.filter(Boolean);
				const identifiers = encodeURIComponent(genes.join('\r'));
				const imageUrl = `${STRING_IMAGE_BASE}?identifiers=${identifiers}&species=${encodeURIComponent(species)}`;

				const root = this.shadowRoot as ShadowRoot;
				root.innerHTML = `
					<style>${STYLES}</style>
					${title ? `<p class="title">${escapeHtml(title)}</p>` : ''}
					<img src="${imageUrl}" alt="STRING protein-protein interaction network for ${escapeHtml(genes.join(', '))}" />
					<p class="error" hidden>Could not load a STRING interaction network for "${escapeHtml(genes.join(', '))}" — check the gene name(s) and species taxon ID.</p>
				`;
				const img = root.querySelector('img') as HTMLImageElement;
				const error = root.querySelector('.error') as HTMLElement;
				img.addEventListener('error', () => {
					img.hidden = true;
					error.hidden = false;
				});
			}
		}

		if (!customElements.get(INTERACTION_NETWORK_TAG)) {
			customElements.define(INTERACTION_NETWORK_TAG, InteractionNetworkElement);
		}
	}

	registry.register('interaction-network', {
		tag: INTERACTION_NETWORK_TAG,
		domain: 'bio',
		title: 'Protein-Protein Interaction Network (STRING)',
		description:
			'Renders a protein-protein interaction network image for one or more genes/proteins, via the STRING ' +
			'database. Use this when the author wants to show what a gene/protein interacts with, not its own ' +
			'structure/sequence (see structure/protvista) or a pathway map (see pathway).',
		schema: {
			gene: {
				type: 'string',
				required: true,
				description: 'One gene/protein identifier, or several comma-separated (e.g. "TP53" or "TP53,MDM2,BRCA1").',
			},
			species: {
				type: 'number',
				description: `NCBI taxonomy ID for the species (e.g. 9606 for human, 10090 for mouse). Defaults to ${DEFAULT_SPECIES}.`,
			},
			title: {
				type: 'string',
				description: 'Optional title rendered above the network.',
			},
		},
	});
}
