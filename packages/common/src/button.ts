import type { ComponentRegistry } from '@basemark/core';

export const BUTTON_TAG = 'basemark-button';

const VARIANTS = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;
const SIZES = ['default', 'sm', 'lg', 'icon'] as const;

// inline-flex (not block, unlike card/columns/tabs) since a button is meant
// to sit inside a sentence via the text-directive form (:button[Label]{...}),
// same shape as shadcn's own Button. --ring reuses the same focus token every
// other interactive common component (input) uses, so keyboard focus reads
// consistently across the package.
const STYLES = `
	:host {
		display: inline-flex;
		font-family: var(--font-sans);
	}
	:host([hidden]) { display: none; }
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		font: inherit;
		font-weight: 500;
		font-size: 0.875rem;
		white-space: nowrap;
		border-radius: var(--radius);
		border: 1px solid transparent;
		cursor: pointer;
		text-decoration: none;
		padding: 0.5rem 1rem;
		height: 2.25rem;
		box-sizing: border-box;
	}
	.btn:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}
	.btn:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
	.size-sm { height: 2rem; padding: 0.375rem 0.75rem; font-size: 0.8125rem; }
	.size-lg { height: 2.5rem; padding: 0.625rem 1.5rem; }
	.size-icon { height: 2.25rem; width: 2.25rem; padding: 0; }
	.variant-default { background: var(--primary); color: var(--primary-foreground); }
	.variant-secondary { background: var(--secondary); color: var(--secondary-foreground); }
	.variant-destructive { background: var(--destructive); color: var(--primary-foreground); }
	.variant-outline { background: var(--background); color: var(--foreground); border-color: var(--border); }
	.variant-ghost { background: transparent; color: var(--foreground); }
	.variant-link { background: transparent; color: var(--primary); padding: 0; height: auto; text-decoration: underline; text-underline-offset: 4px; }
`;

export function registerButton(registry: ComponentRegistry): void {
	// Guarded and declared inside the function, not at module scope — see
	// @basemark/core's error-element.ts and AGENTS.md's "custom element class
	// must never be declared at module scope" note. Needed so registerButton()
	// stays importable from a DOM-less consumer (e.g. @basemark/cli under Bun).
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		// A single custom element renders as either <a> or <button> depending
		// on whether `href` is set — mirrors shadcn's Button-as-Link pattern
		// (asChild + next/link) without needing a separate directive for
		// link-styled CTAs, the most common use of Button inside a rendered
		// content document.
		class ButtonElement extends HTMLElement {
			static get observedAttributes(): string[] {
				return ['variant', 'size', 'href', 'disabled'];
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
				const variant = VARIANTS.includes(this.getAttribute('variant') as (typeof VARIANTS)[number])
					? (this.getAttribute('variant') as string)
					: 'default';
				const size = SIZES.includes(this.getAttribute('size') as (typeof SIZES)[number])
					? (this.getAttribute('size') as string)
					: 'default';
				const href = this.getAttribute('href');
				const disabled = this.hasAttribute('disabled');
				const asLink = Boolean(href) && !disabled;

				// Built via DOM APIs, not string interpolation, for the one part of
				// this that's untrusted author input: `href` could otherwise break out
				// of its attribute (e.g. `" onclick="..."`) if concatenated into
				// innerHTML the way class/tag-name are above (both are internally
				// controlled, not author-supplied strings).
				root.innerHTML = `<style>${STYLES}</style>`;
				const el = document.createElement(asLink ? 'a' : 'button');
				el.className = `btn variant-${variant} size-${size}`;
				if (asLink) el.setAttribute('href', href as string);
				if (disabled) el.setAttribute('disabled', '');
				el.appendChild(document.createElement('slot'));
				root.appendChild(el);
			}
		}

		if (!customElements.get(BUTTON_TAG)) {
			customElements.define(BUTTON_TAG, ButtonElement);
		}
	}

	registry.register('button', {
		tag: BUTTON_TAG,
		domain: 'common',
		title: 'Button',
		description:
			'An inline call-to-action, written as a text directive: :button[Label]{variant="..." size="..."}. Set `href` ' +
			'to render as a link styled as a button (e.g. a CTA to another page) instead of an inert <button>.',
		schema: {
			variant: {
				type: 'string',
				description: `One of: ${VARIANTS.join(', ')}. Defaults to "default".`,
			},
			size: {
				type: 'string',
				description: `One of: ${SIZES.join(', ')}. Defaults to "default".`,
			},
			href: {
				type: 'string',
				description: 'If set, renders as a link (<a href>) instead of a <button>.',
			},
			disabled: {
				type: 'boolean',
				description: 'Disables the button. Ignored if `href` is set.',
			},
		},
	});
}
