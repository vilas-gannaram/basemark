import * as echarts from 'echarts';
import type { ComponentRegistry } from '@basemark/core';

// echarts imports cleanly under Bun with no DOM — unlike @basemark/bio, no
// dynamic import needed, only the module-scope class guard (AGENTS.md).

// Normalizes inline comma-separated attrs (Tier 3, ARCH §2) to this shape.
// Deliberately no hosted-`data`-URL mode — see this package's README's "Why no hosted-file mode".
export interface ChartRow {
	x: string;
	y: string;
}

export interface ChartElementConfig<A extends string> {
	// Every attr this chart type reads (besides `title`, handled separately).
	observedAttrs: readonly A[];
	// Resolves this document's actual data from its inline attrs. Throws
	// (with a message meant for the rendered error, not just a console log)
	// if the required attrs weren't given.
	getRows: (attrs: Partial<Record<A, string>>) => ChartRow[];
	// Plain object, not ECharts' EChartsOption — avoids fighting its full
	// surface. `attrs` param is mainly for gauge.ts (no tabular rows at all).
	buildOption: (rows: ChartRow[], title: string | null, attrs: Partial<Record<A, string>>) => Record<string, unknown>;
}

// Splits two parallel comma-separated lists into rows. Mismatched lengths
// aren't an error — trailing entries on the longer list are silently dropped.
export function splitInlineLists(a: string, b: string): [string[], string[]] {
	return [a.split(',').map((value) => value.trim()), b.split(',').map((value) => value.trim())];
}

// Shared by bar/line/pie/radar/funnel. scatter.ts doesn't use this — both its axes are numeric, no "label" concept.
export function getLabelValueRows(chartName: string, attrs: { labels?: string; values?: string }): ChartRow[] {
	if (attrs.labels && attrs.values) {
		const [labels, values] = splitInlineLists(attrs.labels, attrs.values);
		return labels.map((x, i) => ({ x, y: values[i] ?? '' }));
	}
	throw new Error(`${chartName}: needs both \`labels\` and \`values\`.`);
}

// ECharts has no idea theme.css's custom properties exist — reading their
// computed values off the host (light DOM, where they inherit into) is the
// only way to make chart colors follow the theme. hasAxes is conditional
// since pie/gauge/radar/funnel have no xAxis/yAxis to style.
function themeOption(host: HTMLElement, hasAxes: boolean): Record<string, unknown> {
	const style = getComputedStyle(host);
	const token = (name: string) => style.getPropertyValue(name).trim();

	const base: Record<string, unknown> = {
		color: ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'].map(token),
		textStyle: { color: token('--foreground'), fontFamily: token('--font-sans') },
	};
	if (!hasAxes) return base;

	const axisLine = { lineStyle: { color: token('--border') } };
	const axisLabel = { color: token('--muted-foreground') };
	return {
		...base,
		xAxis: { axisLine, axisLabel },
		yAxis: { axisLine, axisLabel, splitLine: { lineStyle: { color: token('--border') } } },
	};
}

const HOST_STYLE = `
	:host {
		display: block;
		box-sizing: border-box;
		margin: 1.5rem 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.75rem;
		background: var(--card);
		color: var(--card-foreground);
		font-family: var(--font-sans);
	}
	.chart {
		width: 100%;
		height: 320px;
	}
	.error {
		color: var(--destructive);
		font-size: 0.875rem;
	}
`;

// Owns the shadow root, echarts instance, and resize handling — each chart
// type just resolves rows and builds an option. Mirrors bio's createLocusZoomElement.
export function createChartElement<A extends string>(config: ChartElementConfig<A>): CustomElementConstructor {
	return class extends HTMLElement {
		private chart?: echarts.ECharts;
		private resizeObserver?: ResizeObserver;
		private lastSize: { width: number; height: number } | null = null;
		// Captured once, then the `title` attribute is stripped — see connectedCallback.
		private titleText: string | null = null;

		// 'title' excluded — handled once in connectedCallback, not on every attribute change.
		static get observedAttributes(): string[] {
			return [...config.observedAttrs];
		}

		constructor() {
			super();
			this.attachShadow({ mode: 'open' });
		}

		connectedCallback(): void {
			// `title` is a native HTML attribute — left on the host it triggers the
			// browser's own tooltip, fighting ECharts' tooltip (confirmed flicker).
			this.titleText = this.getAttribute('title');
			if (this.hasAttribute('title')) this.removeAttribute('title');
			void this.render();
		}

		attributeChangedCallback(): void {
			if (this.isConnected) void this.render();
		}

		disconnectedCallback(): void {
			this.resizeObserver?.disconnect();
			this.chart?.dispose();
		}

		private async render(): Promise<void> {
			// Not "bail if any attr is missing" (as common does) — only getRows() knows which attrs are actually required.
			const attrs = {} as Partial<Record<A, string>>;
			for (const name of config.observedAttrs) {
				const value = this.getAttribute(name);
				if (value !== null) attrs[name] = value;
			}

			const root = this.shadowRoot as ShadowRoot;
			root.innerHTML = `<style>${HOST_STYLE}</style><div class="chart"></div>`;
			const container = root.querySelector('.chart') as HTMLElement;

			let rows: ChartRow[];
			try {
				rows = await config.getRows(attrs);
			} catch (error) {
				root.innerHTML = `<style>${HOST_STYLE}</style><p class="error">${error instanceof Error ? error.message : String(error)}</p>`;
				return;
			}

			const chartOption = config.buildOption(rows, this.titleText, attrs);

			this.chart?.dispose();
			this.chart = echarts.init(container);
			// Two setOption calls, not merged — ECharts merges sequential calls by
			// default, so theme fields survive underneath each chart's own option.
			this.chart.setOption(themeOption(this, 'xAxis' in chartOption || 'yAxis' in chartOption));
			this.chart.setOption(chartOption);

			// ECharts sizes its canvas at init only — needs an explicit resize()
			// on later layout changes (e.g. basemark-columns). Same pattern as bio's locuszoom shared.ts.
			//
			// Guarded against no-op firings — a spurious same-size ResizeObserver
			// callback during hover produced a confirmed flash bug (resize() clears + redraws unconditionally).
			this.lastSize = { width: container.clientWidth, height: container.clientHeight };
			this.resizeObserver?.disconnect();
			this.resizeObserver = new ResizeObserver(() => {
				const { clientWidth: width, clientHeight: height } = container;
				if (this.lastSize?.width === width && this.lastSize?.height === height) return;
				this.lastSize = { width, height };
				this.chart?.resize();
			});
			this.resizeObserver.observe(container);
		}
	};
}

// Takes a factory, not a built class — createChartElement's `class extends
// HTMLElement` runs the moment it's called, so the guard must wrap that call itself.
export function defineChart(tag: string, buildElementClass: () => CustomElementConstructor): void {
	if (typeof HTMLElement === 'undefined' || typeof customElements === 'undefined') return;
	if (customElements.get(tag)) return;
	customElements.define(tag, buildElementClass());
}

export type { ComponentRegistry };
