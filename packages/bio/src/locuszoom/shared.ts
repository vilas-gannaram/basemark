// './locuszoom' is an ambient .d.ts (declare module 'locuszoom' {...} — see
// that file). This side-effect import is required, not just belt-and-
// suspenders: a downstream consumer with its own separate `tsc` run (e.g.
// examples/vanilla, whose tsconfig only globs its own "src") never discovers
// an ambient declaration file that nothing actually imports — only this
// package's own tsconfig happens to glob-include it directly.
import './locuszoom';

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

// `typeof import(...)` (a type query, not a runtime import statement) sidesteps
// a real TS limitation: 'locuszoom''s ambient module (locuszoom.ts) declares
// its default export as `const LocusZoom: LocusZoomStatic; export default
// LocusZoom;` — a value, not a type — and TS's `import type X from 'module'`
// form doesn't resolve that shape into a usable type (TS2749, "refers to a
// value, but is being used as a type"). This gets the same type with no
// import statement of any kind, so it can't trigger locuszoom's own
// module-scope crash outside a browser either way (see createLocusZoomElement
// below for the real runtime import, which is deferred).
export type LocusZoomStatic = (typeof import('locuszoom'))['default'];
type LocusZoomDataSources = InstanceType<LocusZoomStatic['DataSources']>;

export interface LocusZoomElementConfig<A extends string> {
	observedAttrs: readonly A[];
	// Both take `LocusZoom` as a parameter now, rather than closing over a
	// module-scope import — see createLocusZoomElement's comment below for why
	// each call site (assoc.ts et al.) can no longer import 'locuszoom' at its
	// own top level either.
	buildDataSources: (LocusZoom: LocusZoomStatic) => LocusZoomDataSources;
	buildLayout: (LocusZoom: LocusZoomStatic, attrs: Record<A, string>) => Record<string, unknown>;
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
//
// async, unlike @basemark/common's register* functions — `locuszoom` (and
// its CSS) touch `window`/`d3` at their own module scope, same problem
// AGENTS.md's guard note covers for a class declared directly here, so they
// can't be plain top-level imports either (confirmed: `d3 is not defined`
// importing 'locuszoom' under plain Bun). Deferred to a dynamic import,
// awaited before the returned class is declared — its render() closes over
// the now-locally-scoped `LocusZoom` — mirroring structure.ts/protvista.ts.
// Every caller (assoc.ts et al.) must await this, and can no longer build its
// config object's LocusZoom-touching closures at its own module scope either
// (see LocusZoomElementConfig's buildDataSources/buildLayout above).
export async function createLocusZoomElement<A extends string>(config: LocusZoomElementConfig<A>): Promise<CustomElementConstructor> {
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
