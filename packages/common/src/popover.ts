import type { ComponentRegistry } from '@basemark/core';

export const POPOVER_TAG = 'basemark-popover';

const SIDES = ['top', 'bottom', 'left', 'right'] as const;

// Container, not text — body is markdown content, same reasoning as
// card/alert. `trigger` stays a plain attr since it's just a short label.
const STYLES = `
	:host {
		display: inline-block;
		font-family: var(--font-sans);
	}
	.trigger {
		font: inherit;
		font-size: 0.875rem;
		cursor: pointer;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--background);
		color: var(--foreground);
		padding: 0.5rem 1rem;
	}
	.trigger:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}
	.panel {
		/* fixed, not absolute — absolute's containing block (:host) can sit
		   inside an overflow: hidden ancestor (e.g. accordion's .body) that
		   clips it; fixed uses viewport coords instead (see positionPanel()). */
		position: fixed;
		z-index: 50;
		width: max-content;
		max-width: 20rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--popover);
		color: var(--popover-foreground);
		padding: 0.75rem 1rem;
		box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
		font-size: 0.875rem;
	}
	.panel[hidden] { display: none; }
	/* Same reasoning as card.ts: zero the boundary margin/chrome a nested
	   component would otherwise double up against. */
	::slotted(:first-child) { margin-top: 0 !important; }
	::slotted(:last-child) { margin-bottom: 0 !important; }
	::slotted(*) { border: none !important; background: transparent !important; }
`;

export function registerPopover(registry: ComponentRegistry): void {
	// See AGENTS.md's "never declare a custom element class at module scope" — this guard is why.
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		class PopoverElement extends HTMLElement {
			static get observedAttributes(): string[] {
				return ['trigger', 'side'];
			}

			private open = false;
			// Bound once, not per-render — so add/removeEventListener target the same reference.
			private readonly onDocumentPointerDown = (event: PointerEvent): void => {
				if (!this.open) return;
				if (event.composedPath().includes(this)) return;
				this.close();
			};
			private readonly onDocumentKeydown = (event: KeyboardEvent): void => {
				if (event.key === 'Escape') this.close();
			};
			// position: fixed needs manual repositioning on scroll/resize — no-op while closed.
			private readonly onReposition = (): void => {
				if (this.open) this.positionPanel();
			};

			constructor() {
				super();
				this.attachShadow({ mode: 'open' });
			}

			connectedCallback(): void {
				this.render();
				document.addEventListener('pointerdown', this.onDocumentPointerDown);
				document.addEventListener('keydown', this.onDocumentKeydown);
				// capture: true so this also catches scroll inside nested containers — scroll doesn't bubble.
				window.addEventListener('scroll', this.onReposition, { capture: true, passive: true });
				window.addEventListener('resize', this.onReposition);
			}

			disconnectedCallback(): void {
				document.removeEventListener('pointerdown', this.onDocumentPointerDown);
				document.removeEventListener('keydown', this.onDocumentKeydown);
				window.removeEventListener('scroll', this.onReposition, { capture: true });
				window.removeEventListener('resize', this.onReposition);
			}

			attributeChangedCallback(): void {
				if (this.isConnected) this.render();
			}

			private close(): void {
				if (!this.open) return;
				this.open = false;
				this.updateOpenState();
			}

			private resolvedSide(): (typeof SIDES)[number] {
				const side = this.getAttribute('side');
				return SIDES.includes(side as (typeof SIDES)[number]) ? (side as (typeof SIDES)[number]) : 'bottom';
			}

			// Positioned from the trigger's viewport coordinates, not :host — see the .panel comment in STYLES.
			private positionPanel(): void {
				const root = this.shadowRoot as ShadowRoot;
				const trigger = root.querySelector('.trigger') as HTMLElement;
				const panel = root.querySelector('.panel') as HTMLElement;
				const gap = 6; // 0.375rem at the standard 16px root font-size
				const rect = trigger.getBoundingClientRect();

				panel.style.top = panel.style.bottom = panel.style.left = panel.style.right = 'auto';
				switch (this.resolvedSide()) {
					case 'top':
						panel.style.bottom = `${window.innerHeight - rect.top + gap}px`;
						panel.style.left = `${rect.left}px`;
						break;
					case 'right':
						panel.style.top = `${rect.top}px`;
						panel.style.left = `${rect.right + gap}px`;
						break;
					case 'left':
						panel.style.top = `${rect.top}px`;
						panel.style.right = `${window.innerWidth - rect.left + gap}px`;
						break;
					default:
						panel.style.top = `${rect.bottom + gap}px`;
						panel.style.left = `${rect.left}px`;
				}
			}

			private updateOpenState(): void {
				const root = this.shadowRoot as ShadowRoot;
				const panel = root.querySelector('.panel') as HTMLElement;
				const trigger = root.querySelector('.trigger') as HTMLElement;
				panel.hidden = !this.open;
				trigger.setAttribute('aria-expanded', String(this.open));
				if (this.open) this.positionPanel();
			}

			private render(): void {
				const root = this.shadowRoot as ShadowRoot;
				const triggerLabel = this.getAttribute('trigger') ?? 'Open';

				root.innerHTML = `
					<style>${STYLES}</style>
					<button class="trigger" aria-expanded="false" aria-haspopup="true"></button>
					<div class="panel" hidden><slot></slot></div>
				`;

				(root.querySelector('.trigger') as HTMLElement).textContent = triggerLabel;
				root.querySelector('.trigger')?.addEventListener('click', () => {
					this.open = !this.open;
					this.updateOpenState();
				});
			}
		}

		if (!customElements.get(POPOVER_TAG)) {
			customElements.define(POPOVER_TAG, PopoverElement);
		}
	}

	registry.register('popover', {
		tag: POPOVER_TAG,
		domain: 'common',
		title: 'Popover',
		description:
			'A click-to-open panel anchored to a trigger button: :::popover{trigger="..." side="top|bottom|left|right"} ' +
			'...markdown body... :::. Closes on outside click or Escape. Use for supplementary content the reader ' +
			'opts into (e.g. a definition, a short aside) — not for content everyone should see (use alert or card).',
		schema: {
			trigger: {
				type: 'string',
				required: true,
				description: 'Text shown on the clickable trigger button.',
			},
			side: {
				type: 'string',
				description: `One of: ${SIDES.join(', ')}. Defaults to "bottom".`,
			},
		},
	});
}
