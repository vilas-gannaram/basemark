import type { ComponentRegistry } from '@basemark/core';
import { createChartElement, defineChart, splitInlineLists, type IChartRow } from './chart';

export const SCATTER_CHART_TAG = 'basemark-scatter-chart';

const OBSERVED_ATTRS = ['xValues', 'yValues'] as const;

// Same inline-only shape as bar.ts/line.ts, but the attrs are named
// `xValues`/`yValues` instead of `labels`/`values` — there's no "label"
// concept for a scatter plot, both axes are numeric.
function getRows(attrs: TAttrs): IChartRow[] {
	if (attrs.xValues && attrs.yValues) {
		const [xs, ys] = splitInlineLists(attrs.xValues, attrs.yValues);
		return xs.map((x, i) => ({ x, y: ys[i] ?? '' }));
	}
	throw new Error('scatter-chart: needs both `xValues` and `yValues`.');
}

// Unlike bar/line, both axes are numeric — no category axis, since a
// scatter plot is about the relationship between two measured values, not a
// value keyed by a label.
function buildOption(rows: IChartRow[], title: string | null): Record<string, unknown> {
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
			'line-chart). `xValues`+`yValues`, two comma-separated number lists — e.g. xValues="160,165,170" ' +
			'yValues="55,60,68".',
		schema: {
			xValues: {
				type: 'string',
				required: true,
				description: 'Comma-separated numbers for the x axis, e.g. "160,165,170". Pairs with `yValues`.',
			},
			yValues: {
				type: 'string',
				required: true,
				description: 'Comma-separated numbers for the y axis, e.g. "55,60,68". Pairs with `xValues`.',
			},
			title: { type: 'string', description: 'Optional chart title.' },
		},
	});
}

type TAttrs = Partial<Record<(typeof OBSERVED_ATTRS)[number], string>>;
