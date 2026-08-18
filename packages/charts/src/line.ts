import type { ComponentRegistry } from '@basemark/core';
import { createChartElement, defineChart, getLabelValueRows, type ChartRow } from './chart';

export const LINE_CHART_TAG = 'basemark-line-chart';

const OBSERVED_ATTRS = ['labels', 'values'] as const;

function buildOption(rows: ChartRow[], title: string | null): Record<string, unknown> {
	return {
		title: title ? { text: title } : undefined,
		tooltip: {},
		xAxis: { type: 'category', data: rows.map((row) => row.x) },
		yAxis: { type: 'value' },
		series: [{ type: 'line', data: rows.map((row) => Number(row.y)) }],
	};
}

export function registerLineChart(registry: ComponentRegistry): void {
	defineChart(LINE_CHART_TAG, () =>
		createChartElement({ observedAttrs: OBSERVED_ATTRS, getRows: (attrs) => getLabelValueRows('line-chart', attrs), buildOption }),
	);
	registry.register('line-chart', {
		tag: LINE_CHART_TAG,
		domain: 'charts',
		title: 'Line Chart',
		description:
			'Renders a line chart, a trend over an ordered sequence (e.g. time). `labels`+`values`, two comma-separated ' +
			'lists — e.g. labels="Jan,Feb,Mar" values="120,150,170".',
		schema: {
			labels: { type: 'string', required: true, description: 'Comma-separated x-axis labels, e.g. "Jan,Feb,Mar". Pairs with `values`.' },
			values: { type: 'string', required: true, description: 'Comma-separated numbers, e.g. "120,150,170". Pairs with `labels`.' },
			title: { type: 'string', description: 'Optional chart title.' },
		},
	});
}
