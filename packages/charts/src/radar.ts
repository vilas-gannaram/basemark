import type { ComponentRegistry } from '@basemark/core';
import { createChartElement, defineChart, getLabelValueRows, type ChartRow } from './chart';

export const RADAR_CHART_TAG = 'basemark-radar-chart';

const OBSERVED_ATTRS = ['labels', 'values'] as const;

// Single series only, v1 — one entity across several dimensions, not
// multiple overlaid. Axis max is the largest value * 1.2, not a fixed 100 (units are arbitrary, not always %).
function buildOption(rows: ChartRow[], title: string | null): Record<string, unknown> {
	const values = rows.map((row) => Number(row.y));
	const max = Math.max(...values, 1) * 1.2;

	return {
		title: title ? { text: title } : undefined,
		tooltip: {},
		radar: { indicator: rows.map((row) => ({ name: row.x, max })) },
		series: [{ type: 'radar', data: [{ value: values, name: title ?? undefined }] }],
	};
}

export function registerRadarChart(registry: ComponentRegistry): void {
	defineChart(RADAR_CHART_TAG, () =>
		createChartElement({ observedAttrs: OBSERVED_ATTRS, getRows: (attrs) => getLabelValueRows('radar-chart', attrs), buildOption }),
	);
	registry.register('radar-chart', {
		tag: RADAR_CHART_TAG,
		domain: 'charts',
		title: 'Radar Chart',
		description:
			'Renders a radar (spider) chart — one entity scored across several dimensions at once (e.g. a product rated ' +
			'on speed/price/quality/support/design). Use this when bar-chart would need too many side-by-side bars to ' +
			'show a multi-dimensional profile at a glance. `labels`+`values`, two comma-separated lists — e.g. ' +
			'labels="Speed,Price,Quality,Support" values="8,6,9,7".',
		schema: {
			labels: {
				type: 'string',
				required: true,
				description: 'Comma-separated dimension names, e.g. "Speed,Price,Quality". Pairs with `values`.',
			},
			values: { type: 'string', required: true, description: 'Comma-separated scores, e.g. "8,6,9". Pairs with `labels`.' },
			title: { type: 'string', description: 'Optional chart title, also used as the single series name.' },
		},
	});
}
