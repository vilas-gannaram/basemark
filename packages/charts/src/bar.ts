import type { ComponentRegistry } from '@basemark/core';
import { createChartElement, defineChart, getLabelValueRows, type IChartRow } from './chart';

export const BAR_CHART_TAG = 'basemark-bar-chart';

const OBSERVED_ATTRS = ['labels', 'values'] as const;

function buildOption(rows: IChartRow[], title: string | null): Record<string, unknown> {
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
			'Renders a bar chart, comparing a value across discrete categories. `labels`+`values`, two comma-separated ' +
			'lists — e.g. labels="Jan,Feb,Mar" values="120,150,170".',
		schema: {
			labels: { type: 'string', required: true, description: 'Comma-separated category labels, e.g. "Jan,Feb,Mar". Pairs with `values`.' },
			values: { type: 'string', required: true, description: 'Comma-separated numbers, e.g. "120,150,170". Pairs with `labels`.' },
			title: { type: 'string', description: 'Optional chart title.' },
		},
	});
}
