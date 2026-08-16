import type { ComponentRegistry } from '@basemark/core';

export const SEPARATOR_TAG = 'basemark-separator';

const ORIENTATIONS = ['horizontal', 'vertical'] as const;

// Leaf directive — a plain divider line, no content. Purely a --border
// token consumer; exists as a themeable alternative to a raw markdown `---`
// thematic break for authors who want it to read as UI chrome rather than a
// prose section break.
const STYLES = `
	:host {
		display: block;
		box-sizing: border-box;
	}
	:host(.horizontal) {
		margin: 1rem 0;
		height: 1px;
	}
	:host(.vertical) {
		display: inline-block;
		margin: 0 1rem;
		width: 1px;
		height: 1.5rem;
	}
	.line {
		background: var(--border);
		width: 100%;
		height: 100%;
	}
`;

export function registerSeparator(registry: ComponentRegistry): void {
	// Guarded and declared inside the function, not at module scope — see
	// @basemark/core's error-element.ts and AGENTS.md's "custom element class
	// must never be declared at module scope" note. Needed so
	// registerSeparator() stays importable from a DOM-less consumer (e.g.
	// @basemark/cli under Bun).
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		class SeparatorElement extends HTMLElement {
			static get observedAttributes(): string[] {
				return ['orientation'];
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
				const orientation = ORIENTATIONS.includes(this.getAttribute('orientation') as (typeof ORIENTATIONS)[number])
					? (this.getAttribute('orientation') as string)
					: 'horizontal';

				this.className = orientation;
				this.setAttribute('role', 'separator');

				root.innerHTML = `<style>${STYLES}</style><div class="line"></div>`;
			}
		}

		if (!customElements.get(SEPARATOR_TAG)) {
			customElements.define(SEPARATOR_TAG, SeparatorElement);
		}
	}

	registry.register('separator', {
		tag: SEPARATOR_TAG,
		domain: 'common',
		title: 'Separator',
		description:
			'A themed divider line: ::separator{orientation="horizontal|vertical"}. Defaults to horizontal. Use over a ' +
			'plain markdown "---" when the divider should read as UI chrome (matching the rest of the common set) ' +
			'rather than a prose section break.',
		schema: {
			orientation: {
				type: 'string',
				description: `One of: ${ORIENTATIONS.join(', ')}. Defaults to "horizontal".`,
			},
		},
	});
}
