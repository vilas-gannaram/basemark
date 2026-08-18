import type { ComponentRegistry } from '@basemark/core';
import { createChartElement, defineChart, getLabelValueRows, type ChartRow } from './chart';

export const RADAR_CHART_TAG = 'basemark-radar-chart';

const OBSERVED_ATTRS = ['data', 'x', 'y', 'labels', 'values'] as const;

// Single series only, v1 — comparing several dimensions for ONE entity
// (e.g. one product's scores across 5 criteria), not multiple entities
// overlaid on the same axes. Each axis's max is the largest value present
// times 1.2 headroom, not a fixed 100 — these are arbitrary units (skill
// scores, ratings), not always percentages.
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
			'show a multi-dimensional profile at a glance. Two ways to supply data — use whichever fits: (1) ' +
			'`labels`+`values`, two comma-separated lists — e.g. labels="Speed,Price,Quality,Support" values="8,6,9,7"; ' +
			'(2) `data`+`x`+`y`, a URL to a hosted .csv/.json file plus the field names to plot.',
		schema: {
			labels: { type: 'string', description: 'Comma-separated dimension names, e.g. "Speed,Price,Quality". Pairs with `values`.' },
			values: { type: 'string', description: 'Comma-separated scores, e.g. "8,6,9". Pairs with `labels`.' },
			data: { type: 'string', description: 'URL to a .csv (header row) or .json (array of objects) file. Pairs with `x`+`y`.' },
			x: { type: 'string', description: 'Field name to use as the dimension name. Only used with `data`.' },
			y: { type: 'string', description: 'Field name to use as the score (numeric). Only used with `data`.' },
			title: { type: 'string', description: 'Optional chart title, also used as the single series name.' },
		},
	});
}
