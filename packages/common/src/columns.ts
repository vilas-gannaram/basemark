import type { ComponentRegistry } from '@basemark/core';

export const COLUMNS_TAG = 'basemark-columns';
const DEFAULT_COLS = 2;

// Layout-only, no border/background. `slot { display: contents }` is load-
// bearing — without it the <slot> itself, not its children, is the grid item.
const STYLES = `
	:host {
		display: block;
		margin: 1.5rem 0;
		font-family: var(--font-sans);
	}
	.grid {
		display: grid;
		gap: 1rem;
	}
	slot {
		display: contents;
	}
	/* min-width: 0 overrides grid's default auto (= min-content size), which
	 * would otherwise let a wide child (e.g. a bio plot's <svg>) force its
	 * track wider than its fair share and overflow the grid. */
	::slotted(*) {
		min-width: 0;
		min-height: 0;
		/* Grid's own gap separates cells, not a child's :host margin — !important since :host outbeats ::slotted(). */
		margin-top: 0 !important;
		margin-bottom: 0 !important;
		/* Columns has no chrome of its own — a child shouldn't add any either. */
		border: none !important;
		background: transparent !important;
	}
`;

export function registerColumns(registry: ComponentRegistry): void {
	// See AGENTS.md's "never declare a custom element class at module scope" — this guard is why.
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		// Each direct child block becomes one grid cell — multi-block cells need a nested :::card:::.
		class ColumnsElement extends HTMLElement {
			static get observedAttributes(): string[] {
				return ['cols'];
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
				const cols = Number(this.getAttribute('cols')) || DEFAULT_COLS;

				root.innerHTML = `<style>${STYLES}</style><div class="grid" style="grid-template-columns: repeat(${cols}, 1fr);"><slot></slot></div>`;
			}
		}

		if (!customElements.get(COLUMNS_TAG)) {
			customElements.define(COLUMNS_TAG, ColumnsElement);
		}
	}

	registry.register('columns', {
		tag: COLUMNS_TAG,
		domain: 'common',
		title: 'Columns',
		description:
			'Lays out its direct child blocks side by side in a CSS grid with the given number of columns. Each child ' +
			'block (paragraph, list, nested component, ...) becomes one column cell; wrap multi-block content in a ' +
			'nested :::card::: to keep it together in one cell. Layout only — no visual chrome of its own.',
		schema: {
			cols: {
				type: 'number',
				description: `Number of columns to lay children out in. Defaults to ${DEFAULT_COLS}.`,
			},
		},
	});
}
