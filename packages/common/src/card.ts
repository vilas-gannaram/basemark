import type { ComponentRegistry } from '@basemark/core';

export const CARD_TAG = 'basemark-card';

// Mirrors bio/structure.ts's :host chrome — theme tokens still inherit across the shadow boundary.
const STYLES = `
	:host {
		display: block;
		box-sizing: border-box;
		margin: 1.5rem 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--card);
		color: var(--card-foreground);
		font-family: var(--font-sans);
	}
	.title {
		margin: 0;
		padding: 0.75rem 1rem 0.25rem;
		font-weight: 600;
	}
	.body {
		padding: 1rem;
	}
	.title + .body {
		padding-top: 0.25rem;
	}
	/* A nested component's own :host margin would double up against our
	 * padded .body — zero only the boundary margin, !important since :host
	 * outbeats ::slotted() on specificity. Same for border/background below:
	 * the card already draws the boundary, a direct child shouldn't draw a second one. */
	::slotted(:first-child) {
		margin-top: 0 !important;
	}
	::slotted(:last-child) {
		margin-bottom: 0 !important;
	}
	::slotted(*) {
		border: none !important;
		background: transparent !important;
	}
`;

export function registerCard(registry: ComponentRegistry): void {
	// See AGENTS.md's "never declare a custom element class at module scope" — this guard is why.
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		// Container children arrive as light-DOM children; the default <slot> projects them into .body.
		class CardElement extends HTMLElement {
			static get observedAttributes(): string[] {
				return ['title'];
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
				const root = this.shadowRoot as ShadowRoot;
				const title = this.getAttribute('title');

				root.innerHTML = `
					<style>${STYLES}</style>
					${title ? `<h3 class="title"></h3>` : ''}
					<div class="body"><slot></slot></div>
				`;

				if (title) {
					const titleEl = root.querySelector('.title') as HTMLElement;
					titleEl.textContent = title;
				}
			}
		}

		if (!customElements.get(CARD_TAG)) {
			customElements.define(CARD_TAG, CardElement);
		}
	}

	registry.register('card', {
		tag: CARD_TAG,
		domain: 'common',
		title: 'Card',
		description:
			'A bordered container with an optional title, holding arbitrary child content. Use this to group related ' +
			'content visually (e.g. a callout, a labeled block of prose or nested components) — not for tabular or ' +
			'multi-panel layouts (see tabs, columns).',
		schema: {
			title: {
				type: 'string',
				description: 'Optional heading shown at the top of the card.',
			},
		},
	});
}
