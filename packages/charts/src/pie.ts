import type { ComponentRegistry } from '@basemark/core';
import { createChartElement, defineChart, getLabelValueRows, type ChartRow } from './chart';

export const PIE_CHART_TAG = 'basemark-pie-chart';

const OBSERVED_ATTRS = ['data', 'x', 'y', 'labels', 'values'] as const;

// Donut, not a solid pie (radius: ['35%', '65%']) — the modern default for
// this shape. `center: ['50%', '58%']` nudges the donut down from the
// title, which otherwise sits directly above it with no headroom — ECharts'
// default center is ['50%', '50%'], and a slice's label line can reach high
// enough to collide with title text at the top of a fixed-height container
// (confirmed: "Other"/"Edge" labels overlapping "Browser market share").
function buildOption(rows: ChartRow[], title: string | null): Record<string, unknown> {
	return {
		title: title ? { text: title, left: 'center', top: '2%' } : undefined,
		tooltip: { trigger: 'item' },
		series: [
			{
				type: 'pie',
				radius: ['35%', '65%'],
				center: ['50%', '58%'],
				data: rows.map((row) => ({ name: row.x, value: Number(row.y) })),
			},
		],
	};
}

export function registerPieChart(registry: ComponentRegistry): void {
	defineChart(PIE_CHART_TAG, () =>
		createChartElement({ observedAttrs: OBSERVED_ATTRS, getRows: (attrs) => getLabelValueRows('pie-chart', attrs), buildOption }),
	);
	registry.register('pie-chart', {
		tag: PIE_CHART_TAG,
		domain: 'charts',
		title: 'Pie Chart (donut)',
		description:
			'Renders a donut chart — proportions of a whole. Use this instead of bar-chart when the point is "what ' +
			'share of the total" rather than "compare these values". Two ways to supply data — use whichever fits: (1) ' +
			'`labels`+`values`, two comma-separated lists, for a handful of numbers you already have — e.g. ' +
			'labels="Chrome,Safari,Firefox" values="65,19,8"; (2) `data`+`x`+`y`, a URL to a hosted .csv/.json file plus ' +
			'the field names to plot.',
		schema: {
			labels: { type: 'string', description: 'Comma-separated slice labels, e.g. "Chrome,Safari,Firefox". Pairs with `values`.' },
			values: { type: 'string', description: 'Comma-separated numbers, e.g. "65,19,8". Pairs with `labels`.' },
			data: { type: 'string', description: 'URL to a .csv (header row) or .json (array of objects) file. Pairs with `x`+`y`.' },
			x: { type: 'string', description: 'Field name to use as the slice label. Only used with `data`.' },
			y: { type: 'string', description: 'Field name to use as the slice value (numeric). Only used with `data`.' },
			title: { type: 'string', description: 'Optional chart title, centered in the donut.' },
		},
	});
}
