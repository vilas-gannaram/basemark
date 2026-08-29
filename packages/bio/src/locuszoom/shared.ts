// Side-effect import required — a downstream consumer's own tsc run never
// discovers './locuszoom''s ambient .d.ts otherwise (only this package's tsconfig globs it).
import './locuszoom';

export const LOCUSZOOM_API_BASE = 'https://portaldev.sph.umich.edu/api/v1/';

const OVERRIDE_STYLE_ID = 'basemark-locuszoom-overrides';

// Targets LocusZoom's own generated markup, which lives outside any shadow
// root — injected once as a real <style> tag. !important beats LocusZoom's own inline writes.
function ensureOverrideStyles(): void {
	if (document.getElementById(OVERRIDE_STYLE_ID)) return;
	const style = document.createElement('style');
	style.id = OVERRIDE_STYLE_ID;
	style.textContent = `
		.lz-toolbar-title {
			display: none !important;
		}
		svg.lz-locuszoom text {
			font-size: 12px !important;
		}
	`;
	document.head.appendChild(style);
}

let plotIdCounter = 0;

// Light DOM, NOT shadow root — LocusZoom.populate() looks up its container
// via a global `d3.select('div#' + plot.id)`, which finds nothing inside a
// shadow root and silently no-ops (open leak risk, see ARCH §10).
//
// async — `locuszoom`/its CSS touch `window`/`d3` at module scope (confirmed
// crash under plain Node), so both are dynamically imported and awaited first.
export async function createLocusZoomElement<A extends string>(config: ILocusZoomElementConfig<A>): Promise<CustomElementConstructor> {
	const { default: LocusZoom } = await import('locuszoom');
	await import('locuszoom/dist/locuszoom.css');

	return class extends HTMLElement {
		private resizeObserver?: ResizeObserver;

		static get observedAttributes(): string[] {
			return [...config.observedAttrs];
		}

		connectedCallback(): void {
			this.render();
		}

		attributeChangedCallback(): void {
			if (this.isConnected) this.render();
		}

		disconnectedCallback(): void {
			this.resizeObserver?.disconnect();
		}

		private render(): void {
			this.resizeObserver?.disconnect();
			ensureOverrideStyles();

			const attrs = {} as Record<A, string>;
			for (const name of config.observedAttrs) {
				const value = this.getAttribute(name);
				if (value === null) return;
				attrs[name] = value;
			}

			this.innerHTML = '';
			this.style.display = 'block';
			this.style.boxSizing = 'border-box';
			this.style.margin = '1.5rem 0';
			this.style.border = '1px solid var(--border)';
			this.style.borderRadius = 'var(--radius)';
			this.style.padding = '0.75rem';
			this.style.background = 'var(--card)';

			const container = document.createElement('div');
			// LocusZoom.populate requires the target element to already have a
			// non-empty `id` — its own auto-id fallback only triggers when
			// `element.id` is `undefined`, which never happens for a real DOM node.
			container.id = `basemark-locuszoom-${plotIdCounter++}`;
			container.className = 'lz-container-responsive';
			this.appendChild(container);

			const plot = LocusZoom.populate(container, config.buildDataSources(LocusZoom), config.buildLayout(LocusZoom, attrs));

			// populate() mounts at its layout's fixed `width` and only corrects on
			// a window resize — this ResizeObserver catches container-only resizes (e.g. basemark-columns).
			this.resizeObserver = new ResizeObserver(() => plot.rescaleSVG());
			this.resizeObserver.observe(container);
		}
	};
}

// Type query, not a runtime import — `import type` can't resolve locuszoom's
// value-typed default export (TS2749), and this form triggers no module-scope crash outside a browser.
export type TLocusZoomStatic = (typeof import('locuszoom'))['default'];
type TLocusZoomDataSources = InstanceType<TLocusZoomStatic['DataSources']>;

export interface ILocusZoomElementConfig<A extends string> {
	observedAttrs: readonly A[];
	// Take `LocusZoom` as a parameter, not a module-scope import — see createLocusZoomElement below.
	buildDataSources: (LocusZoom: TLocusZoomStatic) => TLocusZoomDataSources;
	buildLayout: (LocusZoom: TLocusZoomStatic, attrs: Record<A, string>) => Record<string, unknown>;
}
