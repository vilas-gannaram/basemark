import type { ComponentRegistry } from '@basemark/core';

export const CAROUSEL_TAG = 'basemark-carousel';

// Sliding itself is pure CSS (scroll-snap) — no swipe/autoplay/drag JS, which
// a browser's native horizontal scroll (touchpad, touchscreen, shift+wheel)
// already gives for free. The prev/next buttons are the only JS behavior,
// just nudging scrollLeft by one track's width.
const STYLES = `
	:host {
		display: block;
		box-sizing: border-box;
		margin: 1.5rem 0;
		font-family: var(--font-sans);
	}
	.viewport {
		display: flex;
		gap: 1rem;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scroll-behavior: smooth;
		/* Scrollbar hidden — the prev/next buttons plus native swipe/trackpad
		   scrolling are the intended affordances, a visible scrollbar under a
		   snap track reads as a stray UI element rather than the control. */
		scrollbar-width: none;
	}
	.viewport::-webkit-scrollbar {
		display: none;
	}
	slot {
		display: contents;
	}
	::slotted(*) {
		flex: none;
		width: 100%;
		scroll-snap-align: start;
		/* Same reasoning as columns.ts: the track's own gap separates slides,
		   not a child's own :host margin; !important needed to beat :host's
		   specificity in the child's own shadow root. */
		margin: 0 !important;
	}
	.controls {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}
	.nav-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius);
		border: 1px solid var(--border);
		background: var(--background);
		color: var(--foreground);
		cursor: pointer;
		font: inherit;
	}
	.nav-btn:hover {
		background: var(--muted);
	}
	.nav-btn:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}
`;

export function registerCarousel(registry: ComponentRegistry): void {
	// See AGENTS.md's "never declare a custom element class at module scope" — this guard is why.
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		// Each direct child block of the :::carousel::: container becomes one
		// full-width slide — same "one child = one item" shape as
		// columns.ts, just laid out as a horizontal snap track instead of a
		// grid.
		class CarouselElement extends HTMLElement {
			constructor() {
				super();
				this.attachShadow({ mode: 'open' });
			}

			connectedCallback(): void {
				this.render();
			}

			private render(): void {
				const root = this.shadowRoot as ShadowRoot;

				root.innerHTML = `
					<style>${STYLES}</style>
					<div class="viewport"><slot></slot></div>
					<div class="controls">
						<button class="nav-btn prev" aria-label="Previous slide">‹</button>
						<button class="nav-btn next" aria-label="Next slide">›</button>
					</div>
				`;

				const viewport = root.querySelector('.viewport') as HTMLElement;
				const step = (): number => viewport.clientWidth;

				root.querySelector('.prev')?.addEventListener('click', () => {
					viewport.scrollBy({ left: -step(), behavior: 'smooth' });
				});
				root.querySelector('.next')?.addEventListener('click', () => {
					viewport.scrollBy({ left: step(), behavior: 'smooth' });
				});
			}
		}

		if (!customElements.get(CAROUSEL_TAG)) {
			customElements.define(CAROUSEL_TAG, CarouselElement);
		}
	}

	registry.register('carousel', {
		tag: CAROUSEL_TAG,
		domain: 'common',
		title: 'Carousel',
		description:
			'A horizontally scrollable, snap-aligned set of slides: each direct child block becomes one full-width ' +
			'slide, plus prev/next buttons. Use for a sequence of items meant to be browsed one at a time (e.g. image ' +
			'gallery, testimonials) — use columns if every item should be visible at once.',
	});
}
