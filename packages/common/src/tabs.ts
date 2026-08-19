import type { ComponentRegistry } from '@basemark/core';

export const TABS_TAG = 'basemark-tabs';
export const TAB_PANEL_TAG = 'basemark-tab-panel';

// No border/background of its own — navigation chrome, not a callout box.
// Only the tab-strip's border-bottom and selected-tab highlight carry chrome.
const TABS_STYLES = `
	:host {
		display: block;
		box-sizing: border-box;
		margin: 1.5rem 0;
		color: var(--foreground);
		font-family: var(--font-sans);
	}
	.tab-strip {
		display: flex;
		gap: 0.25rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border);
	}
	.tab-button {
		font: inherit;
		cursor: pointer;
		border: none;
		background: none;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius);
		color: var(--muted-foreground);
	}
	.tab-button[aria-selected='true'] {
		background: var(--muted);
		color: var(--foreground);
	}
	.body {
		padding: 1rem 0;
	}
`;

export function registerTabs(registry: ComponentRegistry): void {
	// See AGENTS.md's "never declare a custom element class at module scope" — this guard is why.
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		// Near-inert shell — basemark-tabs owns all behavior via light-DOM access to its children.
		class TabPanelElement extends HTMLElement {
			constructor() {
				super();
				const root = this.attachShadow({ mode: 'open' });
				// Same margin/border reasoning as card.ts.
				root.innerHTML = `
					<style>
						:host([hidden]) { display: none; }
						::slotted(:first-child) { margin-top: 0 !important; }
						::slotted(:last-child) { margin-bottom: 0 !important; }
						::slotted(*) { border: none !important; background: transparent !important; }
					</style>
					<slot></slot>
				`;
			}
		}

		// One default <slot>, not named — handles a dynamic tab count (see ARCH §6).
		class TabsElement extends HTMLElement {
			private activeIndex = 0;

			constructor() {
				super();
				this.attachShadow({ mode: 'open' });
			}

			connectedCallback(): void {
				this.render();
				const slot = this.shadowRoot?.querySelector('slot');
				slot?.addEventListener('slotchange', () => this.render());
			}

			private get panels(): HTMLElement[] {
				return [...this.querySelectorAll(TAB_PANEL_TAG)] as HTMLElement[];
			}

			private selectTab(index: number): void {
				this.activeIndex = index;
				this.updateVisibility();
				this.updateTabStrip();
			}

			private updateVisibility(): void {
				this.panels.forEach((panel, index) => {
					panel.hidden = index !== this.activeIndex;
				});
			}

			private updateTabStrip(): void {
				const root = this.shadowRoot as ShadowRoot;
				root.querySelectorAll('.tab-button').forEach((button, index) => {
					button.setAttribute('aria-selected', String(index === this.activeIndex));
				});
			}

			private render(): void {
				const root = this.shadowRoot as ShadowRoot;
				const panels = this.panels;
				if (this.activeIndex >= panels.length) this.activeIndex = 0;

				const tabStrip = panels
					.map((panel, index) => {
						const label = panel.getAttribute('label') ?? `Tab ${index + 1}`;
						return `<button class="tab-button" role="tab" aria-selected="${index === this.activeIndex}" data-index="${index}">${label}</button>`;
					})
					.join('');

				root.innerHTML = `
					<style>${TABS_STYLES}</style>
					<div class="tab-strip" role="tablist">${tabStrip}</div>
					<div class="body"><slot></slot></div>
				`;

				root.querySelectorAll('.tab-button').forEach((button) => {
					button.addEventListener('click', () => {
						const index = Number((button as HTMLElement).dataset.index);
						this.selectTab(index);
					});
				});

				this.updateVisibility();
			}
		}

		if (!customElements.get(TAB_PANEL_TAG)) {
			customElements.define(TAB_PANEL_TAG, TabPanelElement);
		}
		if (!customElements.get(TABS_TAG)) {
			customElements.define(TABS_TAG, TabsElement);
		}
	}

	registry.register('tab-panel', {
		tag: TAB_PANEL_TAG,
		domain: 'common',
		title: 'Tab Panel',
		description: 'A single labeled panel of content within a :::tabs::: container. Must be a direct child of tabs.',
		schema: {
			label: {
				type: 'string',
				required: true,
				description: 'Text shown on this panel’s tab button.',
			},
		},
	});

	registry.register('tabs', {
		tag: TABS_TAG,
		domain: 'common',
		title: 'Tabs',
		description:
			'A tabbed container: each direct child must be a :::tab-panel{label="..."}:::. Renders a clickable tab ' +
			'strip and shows one panel at a time. Use this for content that is genuinely alternative views of the same ' +
			'thing (e.g. code samples in different languages); use columns for content meant to be seen side by side.',
	});
}
