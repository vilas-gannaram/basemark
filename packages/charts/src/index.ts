import type { ComponentRegistry } from '@basemark/core';
import { registerBarChart } from './bar';
import { registerLineChart } from './line';
import { registerScatterChart } from './scatter';
import { registerPieChart } from './pie';
import { registerRadarChart } from './radar';
import { registerFunnelChart } from './funnel';
import { registerGaugeChart } from './gauge';

export * from './bar';
export * from './line';
export * from './scatter';
export * from './pie';
export * from './radar';
export * from './funnel';
export * from './gauge';
export * from './chart';

export function registerChartsComponents(registry: ComponentRegistry): void {
	registerBarChart(registry);
	registerLineChart(registry);
	registerScatterChart(registry);
	registerPieChart(registry);
	registerRadarChart(registry);
	registerFunnelChart(registry);
	registerGaugeChart(registry);
}
