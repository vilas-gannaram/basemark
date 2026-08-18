import type { ComponentRegistry } from '@basemark/core';
import { createChartElement, defineChart, getLabelValueRows, type ChartRow } from './chart';

export const BAR_CHART_TAG = 'basemark-bar-chart';

const OBSERVED_ATTRS = ['data', 'x', 'y', 'labels', 'values'] as const;

function buildOption(rows: ChartRow[], title: string | null): Record<string, unknown> {
	return {
		title: title ? { text: title } : undefined,
		tooltip: {},
		xAxis: { type: 'category', data: rows.map((row) => row.x) },
		yAxis: { type: 'value' },
		series: [{ type: 'bar', data: rows.map((row) => Number(row.y)) }],
	};
}

export function registerBarChart(registry: ComponentRegistry): void {
	defineChart(BAR_CHART_TAG, () =>
		createChartElement({ observedAttrs: OBSERVED_ATTRS, getRows: (attrs) => getLabelValueRows('bar-chart', attrs), buildOption }),
	);
	registry.register('bar-chart', {
		tag: BAR_CHART_TAG,
		domain: 'charts',
		title: 'Bar Chart',
		description:
			'Renders a bar chart, comparing a value across discrete categories. Two ways to supply data — use whichever ' +
			'fits: (1) `labels`+`values`, two comma-separated lists, for a handful of numbers you already have (no file ' +
			'needed) — e.g. labels="Jan,Feb,Mar" values="120,150,170"; (2) `data`+`x`+`y`, a URL to a hosted .csv/.json ' +
			'file plus the field names to plot, for a real existing dataset.',
		schema: {
			labels: { type: 'string', description: 'Comma-separated category labels, e.g. "Jan,Feb,Mar". Pairs with `values`.' },
			values: { type: 'string', description: 'Comma-separated numbers, e.g. "120,150,170". Pairs with `labels`.' },
			data: { type: 'string', description: 'URL to a .csv (header row) or .json (array of objects) file. Pairs with `x`+`y`.' },
			x: { type: 'string', description: 'Field name to use as the category axis. Only used with `data`.' },
			y: { type: 'string', description: 'Field name to use as the value axis (numeric). Only used with `data`.' },
			title: { type: 'string', description: 'Optional chart title.' },
		},
	});
}
