import type { ComponentRegistry } from '@basemark/core';

export const POPOVER_TAG = 'basemark-popover';

const SIDES = ['top', 'bottom', 'left', 'right'] as const;

// Container directive, not text — unlike button/badge's single-word inline
// label, a popover's body is markdown content (possibly multi-paragraph,
// possibly nested components), same reasoning as card/alert. The trigger
// text is a plain attr (`trigger="..."`) since it's just a short label, not
// content that needs markdown itself.
const STYLES = `
	:host {
		position: relative;
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
		position: absolute;
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
	.side-bottom { top: calc(100% + 0.375rem); left: 0; }
	.side-top { bottom: calc(100% + 0.375rem); left: 0; }
	.side-right { left: calc(100% + 0.375rem); top: 0; }
	.side-left { right: calc(100% + 0.375rem); top: 0; }
	/* Same reasoning as card.ts: zero the boundary margin/chrome a nested
	   component would otherwise double up against. */
	::slotted(:first-child) { margin-top: 0 !important; }
	::slotted(:last-child) { margin-bottom: 0 !important; }
	::slotted(*) { border: none !important; background: transparent !important; }
`;

class PopoverElement extends HTMLElement {
	static get observedAttributes(): string[] {
		return ['trigger', 'side'];
	}

	private open = false;
	// Bound once in the constructor (not per-render) so addEventListener/
	// removeEventListener in connectedCallback/disconnectedCallback target
	// the same function reference — an inline arrow re-created each render
	// would never actually be removable.
	private readonly onDocumentPointerDown = (event: PointerEvent): void => {
		if (!this.open) return;
		if (event.composedPath().includes(this)) return;
		this.close();
	};
	private readonly onDocumentKeydown = (event: KeyboardEvent): void => {
		if (event.key === 'Escape') this.close();
	};

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback(): void {
		this.render();
		document.addEventListener('pointerdown', this.onDocumentPointerDown);
		document.addEventListener('keydown', this.onDocumentKeydown);
	}

	disconnectedCallback(): void {
		document.removeEventListener('pointerdown', this.onDocumentPointerDown);
		document.removeEventListener('keydown', this.onDocumentKeydown);
	}

	attributeChangedCallback(): void {
		if (this.isConnected) this.render();
	}

	private close(): void {
		if (!this.open) return;
		this.open = false;
		this.updateOpenState();
	}

	private updateOpenState(): void {
		const root = this.shadowRoot as ShadowRoot;
		const panel = root.querySelector('.panel') as HTMLElement;
		const trigger = root.querySelector('.trigger') as HTMLElement;
		panel.hidden = !this.open;
		trigger.setAttribute('aria-expanded', String(this.open));
	}

	private render(): void {
		const root = this.shadowRoot as ShadowRoot;
		const triggerLabel = this.getAttribute('trigger') ?? 'Open';
		const side = SIDES.includes(this.getAttribute('side') as (typeof SIDES)[number]) ? (this.getAttribute('side') as string) : 'bottom';

		root.innerHTML = `
			<style>${STYLES}</style>
			<button class="trigger" aria-expanded="false" aria-haspopup="true"></button>
			<div class="panel side-${side}" hidden><slot></slot></div>
		`;

		(root.querySelector('.trigger') as HTMLElement).textContent = triggerLabel;
		root.querySelector('.trigger')?.addEventListener('click', () => {
			this.open = !this.open;
			this.updateOpenState();
		});
	}
}

export function registerPopover(registry: ComponentRegistry): void {
	if (!customElements.get(POPOVER_TAG)) {
		customElements.define(POPOVER_TAG, PopoverElement);
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
