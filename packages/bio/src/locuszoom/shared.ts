import './locuszoom';
import LocusZoom from 'locuszoom';
import 'locuszoom/dist/locuszoom.css';

export const LOCUSZOOM_API_BASE = 'https://portaldev.sph.umich.edu/api/v1/';

const OVERRIDE_STYLE_ID = 'basemark-locuszoom-overrides';

// Same light-DOM/global-CSS constraint as the locuszoom.css import above —
// these target LocusZoom's own generated markup (toolbar chrome, in-SVG
// <text>), which lives outside any shadow root. Injected once as a real
// <style> tag (not a CSS module import) so no new build-time CSS module
// declaration is needed alongside the existing one for locuszoom.css.
// !important because these compete with LocusZoom's own same-or-higher-
// specificity rules and its layout code's inline style/attribute writes.
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

type LocusZoomDataSources = InstanceType<typeof LocusZoom.DataSources>;

export interface LocusZoomElementConfig<A extends string> {
	observedAttrs: readonly A[];
	buildDataSources: () => LocusZoomDataSources;
	buildLayout: (attrs: Record<A, string>) => Record<string, unknown>;
}

let plotIdCounter = 0;

// Unlike structure.ts/protvista.ts, this stays in light DOM — NOT a shadow
// root. LocusZoom.populate()'s own internals (esm/helpers/display.js) look up
// the container it was just handed via `d3.select('div#' + plot.id)`, a
// global `document`-level ID selector, rather than using the node reference
// it already has. Inside a shadow root that lookup finds nothing and the
// `.append('svg')` that follows silently no-ops — the plot never renders, no
// error thrown. So `locuszoom.css`'s import below stays a genuine global
// side effect for now (a real, open leak risk — see CLAUDE.md/ARCHITECTURE.md
// §10) until that's addressed upstream or patched locally; box styling here
// is applied to the light-DOM host directly instead of via a scoped :host rule.
export function createLocusZoomElement<A extends string>(config: LocusZoomElementConfig<A>): CustomElementConstructor {
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

			const plot = LocusZoom.populate(container, config.buildDataSources(), config.buildLayout(attrs));

			// LocusZoom.populate()'s initial setDimensions() call (esm/helpers/display.js)
			// runs with no arguments, which skips responsive_resize's width-measuring
			// branch entirely (esm/components/plot.js) — the plot mounts at its
			// layout's configured `width` (e.g. 800px) regardless of container size,
			// and only corrects itself on a subsequent `window` `resize` event.
			// A ResizeObserver on our own container catches the case a window resize
			// never would: mounting into a CSS Grid/flex cell that's narrower than
			// the viewport (see basemark-columns) without the window itself resizing.
			this.resizeObserver = new ResizeObserver(() => plot.rescaleSVG());
			this.resizeObserver.observe(container);
		}
	};
}
