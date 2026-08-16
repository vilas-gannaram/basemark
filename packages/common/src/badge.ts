import type { ComponentRegistry } from '@basemark/core';

export const BADGE_TAG = 'basemark-badge';

const VARIANTS = ['default', 'secondary', 'destructive', 'outline'] as const;

// inline-flex, same reasoning as button.ts: a badge is meant to sit inside a
// sentence via the text-directive form (:badge[Label]{...}), e.g. flagging a
// status word ("Beta", "Deprecated") inline in prose.
const STYLES = `
	:host {
		display: inline-flex;
		font-family: var(--font-sans);
	}
	.badge {
		display: inline-flex;
		align-items: center;
		border-radius: 9999px;
		border: 1px solid transparent;
		padding: 0.125rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
	}
	.variant-default { background: var(--primary); color: var(--primary-foreground); }
	.variant-secondary { background: var(--secondary); color: var(--secondary-foreground); }
	.variant-destructive { background: var(--destructive); color: var(--primary-foreground); }
	.variant-outline { background: transparent; color: var(--foreground); border-color: var(--border); }
`;

export function registerBadge(registry: ComponentRegistry): void {
	// Guarded and declared inside the function, not at module scope — see
	// @basemark/core's error-element.ts and AGENTS.md's "custom element class
	// must never be declared at module scope" note. Needed so registerBadge()
	// stays importable from a DOM-less consumer (e.g. @basemark/cli under Bun).
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		class BadgeElement extends HTMLElement {
			static get observedAttributes(): string[] {
				return ['variant'];
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

				root.innerHTML = `
					<style>${STYLES}</style>
					<span class="badge variant-${variant}"><slot></slot></span>
				`;
			}
		}

		if (!customElements.get(BADGE_TAG)) {
			customElements.define(BADGE_TAG, BadgeElement);
		}
	}

	registry.register('badge', {
		tag: BADGE_TAG,
		domain: 'common',
		title: 'Badge',
		description:
			'A small inline status label, written as a text directive: :badge[Label]{variant="..."}. Use for short ' +
			'status words inline in prose (e.g. "Beta", "Deprecated") — not for multi-word content or standalone blocks.',
		schema: {
			variant: {
				type: 'string',
				description: `One of: ${VARIANTS.join(', ')}. Defaults to "default".`,
			},
		},
	});
}
