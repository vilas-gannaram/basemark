export const ERROR_TAG = 'basemark-error';

// Same theme tokens as every other component's :host, plus --destructive
// for the one thing unique to this element: making a parse-time failure
// impossible to miss (ARCHITECTURE.md §3, "fail visibly").
const STYLES = `
	:host {
		display: block;
		box-sizing: border-box;
		margin: 1.5rem 0;
		border: 1px solid var(--destructive);
		border-radius: var(--radius);
		background: var(--card);
		color: var(--card-foreground);
		font-family: var(--font-sans);
	}
	.banner {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--destructive);
		color: var(--primary-foreground);
		border-radius: var(--radius) var(--radius) 0 0;
		font-size: 0.9rem;
	}
	.banner .icon {
		flex: none;
	}
	.source {
		margin: 0;
		padding: 0.6rem 1rem;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--muted-foreground);
		border-bottom: 1px solid var(--border);
		overflow-x: auto;
	}
	.content-label {
		padding: 0.6rem 1rem 0;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted-foreground);
	}
	.body {
		padding: 0.75rem 1rem;
	}
`;

// Parse-time failures (parse.ts's markAsError — an unknown directive, a
// failed prop validation, an unclosed container) all resolve to this tag.
// Registered here rather than left for each renderer to remember, since a
// fallback that itself requires manual setup defeats the point of it.
//
// The class is defined inside registerErrorComponent(), not at module scope
// — `class X extends HTMLElement` evaluates `HTMLElement` the moment the
// class statement runs, not on first instantiation. core.parseMarkdown()
// (which calls this) needs to stay callable in a plain Node test environment
// with no DOM at all, so nothing here can touch `HTMLElement` until the
// guard below has already confirmed it exists.
export function registerErrorComponent(): void {
	if (typeof customElements === 'undefined' || typeof HTMLElement === 'undefined') return;
	if (customElements.get(ERROR_TAG)) return;

	class ErrorElement extends HTMLElement {
		static get observedAttributes(): string[] {
			return ['directive', 'message', 'source'];
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
			const directive = this.getAttribute('directive') ?? '';
			const message = this.getAttribute('message') ?? 'Invalid component';
			const source = this.getAttribute('source') ?? '';
			const hasContent = this.childNodes.length > 0;

			root.innerHTML = `
				<style>${STYLES}</style>
				<div class="banner"><span class="icon">⚠</span><span class="message"></span></div>
				${source ? `<pre class="source"></pre>` : ''}
				${hasContent ? `<p class="content-label">Captured content</p>` : ''}
				<div class="body"><slot></slot></div>
			`;

			// textContent, not string interpolation into innerHTML above —
			// directive names and messages both ultimately come from
			// author-supplied markdown (an attribute value, an unknown
			// directive's own written name), so they're untrusted input.
			(root.querySelector('.message') as HTMLElement).textContent = `"${directive}": ${message}`;
			if (source) (root.querySelector('.source') as HTMLElement).textContent = source;
		}
	}

	customElements.define(ERROR_TAG, ErrorElement);
}
