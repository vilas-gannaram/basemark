import * as echarts from 'echarts';
import type { ComponentRegistry } from '@basemark/core';

// echarts imports cleanly under Bun with no DOM (confirmed) — unlike
// @basemark/bio's vendor libraries, no dynamic import is needed here, only
// the custom-element class itself needs the module-scope guard (AGENTS.md's
// "custom element class must never be declared at module scope" rule).

// Every chart type normalizes both its data sources — a hosted `data` URL
// (Tier 2) or inline comma-separated attrs (Tier 3, ARCHITECTURE.md §2) —
// down to this one shape. buildOption() then never needs to know which mode
// produced a row; only getRows() does.
export interface ChartRow {
	x: string;
	y: string;
}

export interface ChartElementConfig<A extends string> {
	// Every attr this chart type might read — `data`/`title` plus whatever
	// mode-specific attrs it supports (e.g. `x`/`y` for the URL mode,
	// `labels`/`values` for the inline mode). All optional: which ones are
	// actually required depends on which mode the author used, which getRows
	// below decides — the registry schema (see bar.ts et al.) can't express
	// that either/or itself, so it documents both combos instead.
	observedAttrs: readonly A[];
	// Resolves this document's actual data, however it was supplied. Throws
	// (with a message meant for the rendered error, not just a console log)
	// if neither a valid `data` URL nor a valid inline combo was given.
	getRows: (attrs: Partial<Record<A, string>>) => Promise<ChartRow[]> | ChartRow[];
	// ECharts' own `EChartsOption` type is intentionally not used here — each
	// guided directive only ever sets a handful of fields, and this stays a
	// plain object so a future directive isn't fighting ECharts' full option
	// surface just to build a bar/line/scatter config. `attrs` is here mainly
	// for gauge.ts, which has no tabular rows at all (a single value + min/max)
	// — bar/line/scatter/pie/radar/funnel all ignore this third parameter.
	buildOption: (rows: ChartRow[], title: string | null, attrs: Partial<Record<A, string>>) => Record<string, unknown>;
}

// Format is inferred from the URL's extension, not sniffed from
// Content-Type — predictable for both a human and an AI author to reason
// about from the `data` attribute alone. Only a bare `,`-split CSV parser —
// no quoted-field/embedded-comma support (a known gap, see this package's
// README) — real CSV parsing pulls in a dependency this simple case doesn't
// need yet. Returns raw column-keyed rows — callers pick out the `x`/`y`
// fields themselves (see bar.ts's getRows), since the field names are only
// known to each chart type's own `x`/`y` attrs.
export async function fetchRawRows(url: string): Promise<Record<string, string>[]> {
	const response = await fetch(url);
	if (url.endsWith('.csv')) {
		const text = await response.text();
		const [header, ...lines] = text.trim().split('\n');
		const columns = header!.split(',').map((column) => column.trim());
		return lines.map((line) => {
			const values = line.split(',').map((value) => value.trim());
			return Object.fromEntries(columns.map((column, index) => [column, values[index] ?? '']));
		});
	}
	return response.json() as Promise<Record<string, string>[]>;
}

// Splits two parallel comma-separated lists (e.g. `labels`/`values` or
// `xValues`/`yValues`) into rows — the Tier 3 inline-literal path, for an
// author (especially an AI one) with a handful of numbers on hand and no
// file to host them at a URL. Mismatched lengths aren't an error — trailing
// entries on the longer list are silently dropped, since a partial row (a
// label with no value, or vice versa) can't be plotted meaningfully either way.
export function splitInlineLists(a: string, b: string): [string[], string[]] {
	return [a.split(',').map((value) => value.trim()), b.split(',').map((value) => value.trim())];
}

// Shared by bar/line/pie/radar/funnel — every chart type where a category
// label pairs with one numeric value. scatter.ts doesn't use this (both its
// axes are numeric, no "label" concept — see its own xValues/yValues attrs).
export async function getLabelValueRows(
	chartName: string,
	attrs: { data?: string; x?: string; y?: string; labels?: string; values?: string },
): Promise<ChartRow[]> {
	if (attrs.data) {
		if (!attrs.x || !attrs.y) throw new Error(`${chartName}: \`data\` requires \`x\` and \`y\` (field names).`);
		const rawRows = await fetchRawRows(attrs.data);
		return rawRows.map((row) => ({ x: row[attrs.x!] ?? '', y: row[attrs.y!] ?? '' }));
	}
	if (attrs.labels && attrs.values) {
		const [labels, values] = splitInlineLists(attrs.labels, attrs.values);
		return labels.map((x, i) => ({ x, y: values[i] ?? '' }));
	}
	throw new Error(`${chartName}: needs either \`data\`+\`x\`+\`y\`, or \`labels\`+\`values\`.`);
}

// ECharts draws with its own default palette (blue) — it has no idea
// theme.css's CSS custom properties exist, unlike this element's own :host
// chrome (border/background/font below), which is plain CSS and picks them
// up for free. Reading the computed values and feeding them into the
// `option` is the only way to make a chart's actual colors follow the
// theme — `--chart-1`..`--chart-5` are theme.css's shadcn-standard palette,
// made for exactly this. Read from the host element (`this`, in the light
// DOM), not the shadow root — custom properties inherit down into shadow
// DOM, not the other way around.
// Axis styling (`hasAxes`) is applied conditionally, not unconditionally
// merged in — pie/gauge/radar/funnel have no xAxis/yAxis at all, and setting
// one anyway would render a stray empty axis line ECharts has no series tied
// to. `hasAxes` reflects whether the chart's own buildOption() result
// declared an xAxis/yAxis, not the chart type itself, so this stays correct
// without every new chart type needing to say which category it's in.
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

// Shared by every guided chart directive (bar/line/scatter) — each just
// resolves its own rows and builds an ECharts `option`; this owns the
// shadow root, the echarts instance, and resize handling. Mirrors
// @basemark/bio's createLocusZoomElement (one factory, many thin callers).
export function createChartElement<A extends string>(config: ChartElementConfig<A>): CustomElementConstructor {
	return class extends HTMLElement {
		private chart?: echarts.ECharts;
		private resizeObserver?: ResizeObserver;
		private lastSize: { width: number; height: number } | null = null;
		// Captured once, then the `title` DOM attribute is stripped — see
		// connectedCallback. Not re-read live from getAttribute('title')
		// anywhere else, since by the time render() runs the attribute is
		// already gone.
		private titleText: string | null = null;

		// 'title' is NOT in this list, unlike every other chart-specific attr
		// — see connectedCallback for why it's handled separately and only
		// once, not on every attribute change.
		static get observedAttributes(): string[] {
			return [...config.observedAttrs];
		}

		constructor() {
			super();
			this.attachShadow({ mode: 'open' });
		}

		connectedCallback(): void {
			// `title` is a native global HTML attribute — leaving it on the host
			// element makes the browser show its own OS-level tooltip on hover,
			// on top of (and fighting with) ECharts' own tooltip popover
			// (confirmed: both appeared, with visible flicker as the pointer
			// moved). Captured into a field, then stripped, once — not observed
			// for later changes, since directive-authored content is static.
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
			// Not "bail if any declared attr is missing" (as in @basemark/common) —
			// which attrs are required depends on which data mode was used, which
			// only getRows() below knows how to check.
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
			// Two setOption calls, not one merged object — ECharts merges
			// sequential setOption calls by default, so the theme's color/
			// textStyle/axisLine fields survive underneath whatever axis type
			// and series data each chart type's own buildOption sets on top.
			this.chart.setOption(themeOption(this, 'xAxis' in chartOption || 'yAxis' in chartOption));
			this.chart.setOption(chartOption);

			// ECharts sizes its canvas off the container's dimensions at init
			// time only — it doesn't observe the container itself, so a later
			// layout change (e.g. this element mounting into a CSS Grid cell
			// narrower than the viewport, see basemark-columns) needs an
			// explicit resize() call. Same pattern as bio's locuszoom shared.ts.
			//
			// Guarded against no-op firings, not called unconditionally on
			// every observer callback — ResizeObserver can fire for a layout
			// pass that didn't actually change this container's size (e.g. a
			// tooltip nudging a scrollbar into existence elsewhere on the
			// page), and chart.resize() clears + redraws the canvas every
			// time it runs. Calling it on a spurious same-size firing during
			// hover produced a real, confirmed bug: a visible clear-then-
			// redraw flash landing exactly under the pointer, on whatever was
			// being hovered.
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

// Takes a factory, not an already-built class — createChartElement's `class
// extends HTMLElement` runs the moment it's called, so the guard has to wrap
// that call itself, not just customElements.define(). Same reason
// @basemark/common's register* functions declare their class *inside* the
// guarded branch rather than passing one in from outside.
export function defineChart(tag: string, buildElementClass: () => CustomElementConstructor): void {
	if (typeof HTMLElement === 'undefined' || typeof customElements === 'undefined') return;
	if (customElements.get(tag)) return;
	customElements.define(tag, buildElementClass());
}

export type { ComponentRegistry };
