import './locuszoom';
import LocusZoom from 'locuszoom';
import 'locuszoom/dist/locuszoom.css';

export const LOCUSZOOM_API_BASE = 'https://portaldev.sph.umich.edu/api/v1/';

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
		static get observedAttributes(): string[] {
			return [...config.observedAttrs];
		}

		connectedCallback(): void {
			this.render();
		}

		attributeChangedCallback(): void {
			if (this.isConnected) this.render();
		}

		private render(): void {
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

			LocusZoom.populate(container, config.buildDataSources(), config.buildLayout(attrs));
		}
	};
}
