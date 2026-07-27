import type { ComponentRegistry } from '@basemark/core';

export const COLUMNS_TAG = 'basemark-columns';
const DEFAULT_COLS = 2;

// Layout-only: no border/background, unlike card. `slot { display: contents }`
// is load-bearing — without it the <slot> itself (not its assigned nodes)
// would be the grid item, and every projected child would collapse into a
// single cell instead of tiling across grid-template-columns.
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
	/*
	 * Grid items default to min-width: auto, which resolves to their content's
	 * min-content size rather than 0. A child with a wide intrinsic size (e.g.
	 * an <svg width="800"> from a bio plot component) would otherwise force its
	 * 1fr track wider than its fair share, overflowing the grid instead of
	 * shrinking the child to fit. min-width: 0 lets tracks actually honor
	 * grid-template-columns; the child's own overflow handling (if any) takes
	 * over from there.
	 */
	::slotted(*) {
		min-width: 0;
		min-height: 0;
		/*
		 * Cells sit side by side, not stacked — the grid's own gap is what
		 * separates them, not a child's own vertical margin (e.g. bio
		 * components' :host { margin: 1.5rem 0 }). !important is needed since
		 * :host in the child's own shadow root otherwise outbeats ::slotted()
		 * on specificity.
		 */
		margin-top: 0 !important;
		margin-bottom: 0 !important;
		/*
		 * A cell's own component (e.g. a locuszoom-* plot) drawing its own
		 * border/background reads as a floating box misaligned against the
		 * grid's gap-based separation — columns has no chrome of its own (see
		 * the module comment), so a direct child shouldn't add any either.
		 */
		border: none !important;
		background: transparent !important;
	}
`;

// Each direct child block of the :::columns::: container (a paragraph, a
// list, a nested directive, ...) becomes one grid cell. An author who wants
// multiple blocks in a single cell wraps them in a nested :::card:::.
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

export function registerColumns(registry: ComponentRegistry): void {
	if (!customElements.get(COLUMNS_TAG)) {
		customElements.define(COLUMNS_TAG, ColumnsElement);
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
