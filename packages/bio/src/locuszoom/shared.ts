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

// Shared lifecycle for every LocusZoom-backed custom element: wait until all
// observed attrs are present, mount a fresh container, and hand off to
// LocusZoom. What differs per plot type (data sources, layout preset) is
// supplied by the caller — see assoc.ts/gwas-catalog.ts/phewas.ts.
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
