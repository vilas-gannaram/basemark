import type { ComponentRegistry } from '@basemark/core';
import { createChartElement, defineChart, getLabelValueRows, type ChartRow } from './chart';

export const FUNNEL_CHART_TAG = 'basemark-funnel-chart';

const OBSERVED_ATTRS = ['labels', 'values'] as const;

// `sort: 'none'` — ECharts' default 'descending' would silently reorder a
// deliberately author-ordered funnel (usually widest-stage-first) by value.
function buildOption(rows: ChartRow[], title: string | null): Record<string, unknown> {
	return {
		title: title ? { text: title, left: 'center', top: '2%' } : undefined,
		tooltip: { trigger: 'item' },
		series: [
			{
				type: 'funnel',
				sort: 'none',
				data: rows.map((row) => ({ name: row.x, value: Number(row.y) })),
			},
		],
	};
}

export function registerFunnelChart(registry: ComponentRegistry): void {
	defineChart(FUNNEL_CHART_TAG, () =>
		createChartElement({ observedAttrs: OBSERVED_ATTRS, getRows: (attrs) => getLabelValueRows('funnel-chart', attrs), buildOption }),
	);
	registry.register('funnel-chart', {
		tag: FUNNEL_CHART_TAG,
		domain: 'charts',
		title: 'Funnel Chart',
		description:
			'Renders a funnel chart — a sequence of stages narrowing down (e.g. Visitors → Signups → Paying customers). ' +
			'Use this instead of bar-chart when the point is drop-off between ordered stages, not comparing independent ' +
			'categories. Stages render in the order given, not resorted by value. `labels`+`values`, two comma-separated ' +
			'lists, widest stage first — e.g. labels="Visitors,Signups,Paying" values="1000,320,90".',
		schema: {
			labels: {
				type: 'string',
				required: true,
				description: 'Comma-separated stage names, widest first, e.g. "Visitors,Signups,Paying". Pairs with `values`.',
			},
			values: { type: 'string', required: true, description: 'Comma-separated numbers, e.g. "1000,320,90". Pairs with `labels`.' },
			title: { type: 'string', description: 'Optional chart title, centered above the funnel.' },
		},
	});
}
