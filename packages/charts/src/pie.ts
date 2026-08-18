import type { ComponentRegistry } from '@basemark/core';
import { createChartElement, defineChart, getLabelValueRows, type ChartRow } from './chart';

export const PIE_CHART_TAG = 'basemark-pie-chart';

const OBSERVED_ATTRS = ['labels', 'values'] as const;

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
			'share of the total" rather than "compare these values". `labels`+`values`, two comma-separated lists — ' +
			'e.g. labels="Chrome,Safari,Firefox" values="65,19,8".',
		schema: {
			labels: {
				type: 'string',
				required: true,
				description: 'Comma-separated slice labels, e.g. "Chrome,Safari,Firefox". Pairs with `values`.',
			},
			values: { type: 'string', required: true, description: 'Comma-separated numbers, e.g. "65,19,8". Pairs with `labels`.' },
			title: { type: 'string', description: 'Optional chart title, centered in the donut.' },
		},
	});
}
