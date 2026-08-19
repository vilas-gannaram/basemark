import type { ComponentRegistry } from '@basemark/core';

export const ALERT_TAG = 'basemark-alert';

const VARIANTS = ['default', 'destructive'] as const;

// Container, not leaf — body is prose, same reasoning as card.ts. Near-
// identical structurally; the difference is variant-driven coloring.
const STYLES = `
	:host {
		display: block;
		box-sizing: border-box;
		margin: 1.5rem 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1rem;
		font-family: var(--font-sans);
		background: var(--card);
		color: var(--card-foreground);
	}
	:host(.variant-destructive) {
		border-color: var(--destructive);
		color: var(--destructive);
	}
	.title {
		margin: 0 0 0.25rem;
		font-weight: 600;
		line-height: 1;
	}
	.title + .body {
		margin-top: 0.25rem;
	}
	/* Same reasoning as card.ts: zero the boundary margin/chrome a nested
	   component would otherwise double up against this alert's own box. */
	::slotted(:first-child) { margin-top: 0 !important; }
	::slotted(:last-child) { margin-bottom: 0 !important; }
	::slotted(*) { border: none !important; background: transparent !important; }
`;

export function registerAlert(registry: ComponentRegistry): void {
	// See AGENTS.md's "never declare a custom element class at module scope" — this guard is why.
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		class AlertElement extends HTMLElement {
			static get observedAttributes(): string[] {
				return ['variant', 'title'];
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
				const title = this.getAttribute('title');

				this.className = `variant-${variant}`;

				root.innerHTML = `
					<style>${STYLES}</style>
					${title ? `<p class="title"></p>` : ''}
					<div class="body"><slot></slot></div>
				`;

				if (title) {
					(root.querySelector('.title') as HTMLElement).textContent = title;
				}
			}
		}

		if (!customElements.get(ALERT_TAG)) {
			customElements.define(ALERT_TAG, AlertElement);
		}
	}

	registry.register('alert', {
		tag: ALERT_TAG,
		domain: 'common',
		title: 'Alert',
		description:
			'A callout box for warnings/notices, with an optional title and a markdown body: :::alert{variant="..." ' +
			'title="..."} ...body... :::. Use `variant="destructive"` for errors/warnings; use card for neutral, ' +
			'non-alerting grouped content.',
		schema: {
			variant: {
				type: 'string',
				description: `One of: ${VARIANTS.join(', ')}. Defaults to "default".`,
			},
			title: {
				type: 'string',
				description: 'Optional heading shown above the alert body.',
			},
		},
	});
}
