import type { ComponentRegistry } from '@basemark/core';
import { createChartElement, defineChart, type ChartRow } from './chart';

export const GAUGE_CHART_TAG = 'basemark-gauge-chart';

const OBSERVED_ATTRS = ['value', 'min', 'max'] as const;
type Attrs = Partial<Record<(typeof OBSERVED_ATTRS)[number], string>>;

// No tabular rows — a gauge is one number against a range. getRows() only
// validates `value` is present; buildOption reads `attrs` directly instead.
function getRows(attrs: Attrs): ChartRow[] {
	if (!attrs.value) throw new Error('gauge-chart: `value` is required.');
	return [];
}

function buildOption(_rows: ChartRow[], title: string | null, attrs: Attrs): Record<string, unknown> {
	return {
		title: title ? { text: title } : undefined,
		series: [
			{
				type: 'gauge',
				min: attrs.min ? Number(attrs.min) : 0,
				max: attrs.max ? Number(attrs.max) : 100,
				data: [{ value: Number(attrs.value) }],
			},
		],
	};
}

export function registerGaugeChart(registry: ComponentRegistry): void {
	defineChart(GAUGE_CHART_TAG, () => createChartElement({ observedAttrs: OBSERVED_ATTRS, getRows, buildOption }));
	registry.register('gauge-chart', {
		tag: GAUGE_CHART_TAG,
		domain: 'charts',
		title: 'Gauge Chart',
		description:
			'Renders a single-metric gauge (a KPI dial) — e.g. uptime %, quota used, a score against a target. Use this ' +
			'for one number against a range, not a comparison of several values (see bar-chart) or a proportion of a ' +
			'whole (see pie-chart). No data URL mode — a gauge is always exactly one value.',
		schema: {
			value: { type: 'number', required: true, description: 'The value to show on the gauge.' },
			min: { type: 'number', description: 'Range minimum. Defaults to 0.' },
			max: { type: 'number', description: 'Range maximum. Defaults to 100.' },
			title: { type: 'string', description: 'Optional chart title.' },
		},
	});
}
