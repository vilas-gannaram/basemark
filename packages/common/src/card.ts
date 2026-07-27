import type { ComponentRegistry } from '@basemark/core';

export const CARD_TAG = 'basemark-card';

// Mirrors bio/structure.ts's :host chrome: styling scoped to this element's
// own shadow root, theme values (--border, --radius, --card) still arrive
// via inheritance across the shadow boundary.
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
	/*
	 * Bio components each set their own top-level margin (e.g. structure.ts's
	 * :host { margin: 1.5rem 0 }) for spacing when placed directly in a
	 * document. Nested inside our own padded .body, that's a redundant double
	 * margin. :host in the child's own shadow root outbeats ::slotted() on
	 * specificity ((0,1,0) vs (0,0,1)), so !important is required to actually
	 * win here — only the first/last child's boundary margin is zeroed;
	 * margins between multiple slotted children are left alone.
	 */
	::slotted(:first-child) {
		margin-top: 0 !important;
	}
	::slotted(:last-child) {
		margin-bottom: 0 !important;
	}
	/*
	 * Same reasoning as the margin zeroing above, for border/background: a
	 * slotted component's own :host chrome (border + background) would double
	 * up against this card's own border — the card already establishes the
	 * visual boundary, so a direct child shouldn't draw a second one.
	 */
	::slotted(*) {
		border: none !important;
		background: transparent !important;
	}
`;

// The single case this component exists to prove: a container directive's
// markdown children arrive as light-DOM children of this element (see
// parse.ts's resolveDirectives, which never touches node.children), and a
// default <slot> projects them into the shadow root's body region.
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

export function registerCard(registry: ComponentRegistry): void {
	if (!customElements.get(CARD_TAG)) {
		customElements.define(CARD_TAG, CardElement);
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
