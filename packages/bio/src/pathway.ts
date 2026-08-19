import type { ComponentRegistry } from '@basemark/core';

export const PATHWAY_TAG = 'basemark-pathway';

// KEGG's own REST API — a fixed, well-known host, not a caller-supplied URL
// (ARCH §4's SSRF concern is about arbitrary author-provided URLs; this is
// the same category as protvista/structure fetching their own vendor APIs
// by ID). Renders as a static PNG, not an interactive map — KEGG's
// interactive map is server-rendered HTML with its own JS, out of scope here.
const KEGG_IMAGE_BASE = 'https://rest.kegg.jp/get';

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

// Leaf directive — Tier 1, single ID (ARCH §2).
export async function registerPathway(registry: ComponentRegistry): Promise<void> {
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		class PathwayElement extends HTMLElement {
			static get observedAttributes(): string[] {
				return ['keggid', 'title'];
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
				const keggId = this.getAttribute('keggid');
				if (!keggId) return;
				const title = this.getAttribute('title');
				const imageUrl = `${KEGG_IMAGE_BASE}/${encodeURIComponent(keggId)}/image`;

				const root = this.shadowRoot as ShadowRoot;
				root.innerHTML = `
					<style>${STYLES}</style>
					${title ? `<p class="title">${escapeHtml(title)}</p>` : ''}
					<img src="${imageUrl}" alt="KEGG pathway diagram for ${escapeHtml(keggId)}" />
					<p class="error" hidden>Could not load the KEGG pathway diagram for "${escapeHtml(keggId)}" — check the ID (e.g. "hsa04910").</p>
				`;
				const img = root.querySelector('img') as HTMLImageElement;
				const error = root.querySelector('.error') as HTMLElement;
				img.addEventListener('error', () => {
					img.hidden = true;
					error.hidden = false;
				});
			}
		}

		if (!customElements.get(PATHWAY_TAG)) {
			customElements.define(PATHWAY_TAG, PathwayElement);
		}
	}

	registry.register('pathway', {
		tag: PATHWAY_TAG,
		domain: 'bio',
		title: 'KEGG Pathway Diagram',
		description:
			'Renders a KEGG pathway diagram image for a given KEGG pathway ID. Use this when the author wants to show ' +
			'a biological pathway (metabolic, signaling, disease) as a whole map, not a single gene/protein/variant — ' +
			'see gene/protvista/structure/variant for those.',
		schema: {
			keggid: {
				type: 'string',
				required: true,
				description: 'A KEGG pathway ID, e.g. "hsa04910" (human insulin signaling) or "map00010" (glycolysis, reference).',
			},
			title: {
				type: 'string',
				description: 'Optional title rendered above the diagram.',
			},
		},
	});
}
