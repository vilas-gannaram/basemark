import type { ComponentRegistry } from '@basemark/core';

export const ACCORDION_TAG = 'basemark-accordion';
export const ACCORDION_ITEM_TAG = 'basemark-accordion-item';

// composed: true so it crosses the item's own shadow boundary; bubbles: true
// so basemark-accordion can catch it via a single delegated listener on
// itself, rather than reaching into each item's shadow root directly (see
// AccordionElement's connectedCallback for why that approach is unsafe).
const TOGGLE_EVENT = 'basemark-accordion-item-toggle';

// No border/background of its own, same reasoning as tabs.ts — an accordion
// is navigation/disclosure chrome for its content, not a callout box. Each
// item's border-bottom is the only chrome, functioning as a divider between
// items rather than a wrapper box.
const ACCORDION_STYLES = `
	:host {
		display: block;
		box-sizing: border-box;
		margin: 1.5rem 0;
		color: var(--foreground);
		font-family: var(--font-sans);
		border-top: 1px solid var(--border);
	}
`;

export function registerAccordion(registry: ComponentRegistry): void {
	// See AGENTS.md's "never declare a custom element class at module scope" — this guard is why.
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		// basemark-accordion-item is a near-inert shell, same division of labor
		// as tabs.ts's tab-panel: the item owns its own trigger button +
		// collapse styling, but basemark-accordion owns reading each item's
		// `label` and toggling which one is open, via direct light-DOM access
		// (this.children) — legal across the shadow boundary since light-DOM
		// children are still physically owned by the light tree, not the
		// item's own shadow root.
		class AccordionItemElement extends HTMLElement {
			static get observedAttributes(): string[] {
				return ['label', 'open'];
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
				const label = this.getAttribute('label') ?? '';
				const open = this.hasAttribute('open');

				root.innerHTML = `
					<style>
						:host {
							display: block;
							border-bottom: 1px solid var(--border);
						}
						.trigger {
							display: flex;
							align-items: center;
							justify-content: space-between;
							width: 100%;
							box-sizing: border-box;
							font: inherit;
							font-weight: 500;
							font-size: 0.875rem;
							text-align: left;
							cursor: pointer;
							border: none;
							background: none;
							color: inherit;
							padding: 1rem 0;
						}
						.chevron {
							flex: none;
							transition: transform 0.15s ease;
							transform: rotate(${open ? '180deg' : '0deg'});
						}
						.body {
							overflow: hidden;
							height: ${open ? 'auto' : '0'};
							padding-bottom: ${open ? '1rem' : '0'};
							font-size: 0.875rem;
							color: var(--muted-foreground);
						}
						.body[hidden] { display: none; }
						/* Same reasoning as card.ts: zero the boundary margin/chrome a
						   nested component would otherwise double up against. */
						::slotted(:first-child) { margin-top: 0 !important; }
						::slotted(:last-child) { margin-bottom: 0 !important; }
						::slotted(*) { border: none !important; background: transparent !important; }
					</style>
					<button class="trigger" aria-expanded="${open}"><span class="label"></span><span class="chevron">▾</span></button>
					<div class="body" ${open ? '' : 'hidden'}><slot></slot></div>
				`;

				(root.querySelector('.label') as HTMLElement).textContent = label;
				// Attached fresh each render (innerHTML above just replaced the button) —
				// this is the item wiring up its own trigger, entirely within its own
				// connectedCallback/attributeChangedCallback, so there's no dependency on
				// when the parent accordion happens to run relative to this element.
				root.querySelector('.trigger')?.addEventListener('click', () => {
					this.dispatchEvent(new CustomEvent(TOGGLE_EVENT, { bubbles: true, composed: true }));
				});
			}
		}

		// One default <slot> rather than named slots — same reasoning as
		// tabs.ts: reading each item's `label`/`open` off this.children
		// handles an arbitrary, dynamic number of items with less machinery
		// than named slots would.
		class AccordionElement extends HTMLElement {
			constructor() {
				super();
				this.attachShadow({ mode: 'open' });
			}

			connectedCallback(): void {
				this.render();
				// A single delegated listener on the host itself, not per-item —
				// safe regardless of upgrade order, since it only needs to exist
				// before a click happens, not before any particular child has
				// rendered.
				this.addEventListener(TOGGLE_EVENT, (event) => {
					const item = event.target as HTMLElement;
					if (item.tagName.toLowerCase() === ACCORDION_ITEM_TAG) this.toggle(item);
				});
			}

			private get items(): HTMLElement[] {
				return [...this.querySelectorAll(ACCORDION_ITEM_TAG)] as HTMLElement[];
			}

			private render(): void {
				const root = this.shadowRoot as ShadowRoot;
				root.innerHTML = `<style>${ACCORDION_STYLES}</style><slot></slot>`;
			}

			// Single-open accordion (shadcn's default "single" type): opening
			// one item closes every other one. Multi-open would just skip the
			// close loop below — left as the simplest useful default rather
			// than a `type` prop, since nothing in the common set yet needs
			// the multi-open variant.
			private toggle(target: HTMLElement): void {
				const isOpen = target.hasAttribute('open');
				this.items.forEach((item) => item.removeAttribute('open'));
				if (!isOpen) target.setAttribute('open', '');
			}
		}

		if (!customElements.get(ACCORDION_ITEM_TAG)) {
			customElements.define(ACCORDION_ITEM_TAG, AccordionItemElement);
		}
		if (!customElements.get(ACCORDION_TAG)) {
			customElements.define(ACCORDION_TAG, AccordionElement);
		}
	}

	registry.register('accordion-item', {
		tag: ACCORDION_ITEM_TAG,
		domain: 'common',
		title: 'Accordion Item',
		description: 'A single collapsible section within a :::accordion::: container. Must be a direct child of accordion.',
		schema: {
			label: {
				type: 'string',
				required: true,
				description: 'Text shown on this item’s clickable header.',
			},
		},
	});

	registry.register('accordion', {
		tag: ACCORDION_TAG,
		domain: 'common',
		title: 'Accordion',
		description:
			'A vertically stacked set of collapsible sections: each direct child must be a ' +
			':::accordion-item{label="..."}:::. Opening one item closes any other open item. Use for FAQ-style content ' +
			'or optional detail the reader may not need — use tabs for content meant as alternative views of the same thing.',
	});
}
