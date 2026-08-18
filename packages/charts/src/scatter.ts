import type { ComponentRegistry } from '@basemark/core';
import { createChartElement, defineChart, fetchRawRows, splitInlineLists, type ChartRow } from './chart';

export const SCATTER_CHART_TAG = 'basemark-scatter-chart';

const OBSERVED_ATTRS = ['data', 'x', 'y', 'xValues', 'yValues'] as const;
type Attrs = Partial<Record<(typeof OBSERVED_ATTRS)[number], string>>;

// Same two-mode shape as bar.ts/line.ts, but the inline attrs are named
// `xValues`/`yValues` instead of `labels`/`values` — there's no "label"
// concept for a scatter plot, both axes are numeric.
async function getRows(attrs: Attrs): Promise<ChartRow[]> {
	if (attrs.data) {
		if (!attrs.x || !attrs.y) throw new Error('scatter-chart: `data` requires `x` and `y` (field names).');
		const rawRows = await fetchRawRows(attrs.data);
		return rawRows.map((row) => ({ x: row[attrs.x!] ?? '', y: row[attrs.y!] ?? '' }));
	}
	if (attrs.xValues && attrs.yValues) {
		const [xs, ys] = splitInlineLists(attrs.xValues, attrs.yValues);
		return xs.map((x, i) => ({ x, y: ys[i] ?? '' }));
	}
	throw new Error('scatter-chart: needs either `data`+`x`+`y`, or `xValues`+`yValues`.');
}

// Unlike bar/line, both axes are numeric — no category axis, since a
// scatter plot is about the relationship between two measured values, not a
// value keyed by a label.
function buildOption(rows: ChartRow[], title: string | null): Record<string, unknown> {
	return {
		title: title ? { text: title } : undefined,
		tooltip: {},
		xAxis: { type: 'value' },
		yAxis: { type: 'value' },
		series: [{ type: 'scatter', data: rows.map((row) => [Number(row.x), Number(row.y)]) }],
	};
}

export function registerScatterChart(registry: ComponentRegistry): void {
	defineChart(SCATTER_CHART_TAG, () => createChartElement({ observedAttrs: OBSERVED_ATTRS, getRows, buildOption }));
	registry.register('scatter-chart', {
		tag: SCATTER_CHART_TAG,
		domain: 'charts',
		title: 'Scatter Chart',
		description:
			'Renders a scatter plot — the relationship between two numeric values, both axes numeric (unlike bar-chart/' +
			'line-chart). Two ways to supply data — use whichever fits: (1) `xValues`+`yValues`, two comma-separated ' +
			'number lists, for values you already have (no file needed) — e.g. xValues="160,165,170" yValues="55,60,68"; ' +
			'(2) `data`+`x`+`y`, a URL to a hosted .csv/.json file plus the field names to plot, for a real existing dataset.',
		schema: {
			xValues: { type: 'string', description: 'Comma-separated numbers for the x axis, e.g. "160,165,170". Pairs with `yValues`.' },
			yValues: { type: 'string', description: 'Comma-separated numbers for the y axis, e.g. "55,60,68". Pairs with `xValues`.' },
			data: { type: 'string', description: 'URL to a .csv (header row) or .json (array of objects) file. Pairs with `x`+`y`.' },
			x: { type: 'string', description: 'Field name for the x axis (numeric). Only used with `data`.' },
			y: { type: 'string', description: 'Field name for the y axis (numeric). Only used with `data`.' },
			title: { type: 'string', description: 'Optional chart title.' },
		},
	});
}
