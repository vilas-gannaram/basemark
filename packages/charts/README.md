# @basemark/charts

Chart and plot components for Markdown, built on ECharts. A separate package from `@basemark/common` since charting is a heavier dependency than the average layout component.

## Usage

```ts
import { createRegistry, renderMarkdown } from '@basemark/core';
import { registerChartsComponents } from '@basemark/charts';

const registry = createRegistry();
registerChartsComponents(registry);

renderMarkdown('::bar-chart{labels="Jan,Feb,Mar" values="120,150,170"}', registry);
```

Data goes straight in the directive as comma-separated lists — no file, no upload, no fetch:

```
::bar-chart{labels="Jan,Feb,Mar" values="120,150,170"}
```

`bar-chart`/`line-chart`/`pie-chart`/`radar-chart`/`funnel-chart` take `labels` + `values`; `scatter-chart` takes `xValues` + `yValues` (both axes are numeric, no label concept).

## Components

### Trends & comparison

- `bar-chart` — categories on x, numeric value on y
- `line-chart` — a trend over an ordered sequence
- `scatter-chart` — both axes numeric, no category concept

### Parts of a whole

- `pie-chart` — donut styling by default
- `funnel-chart` — ordered stages narrowing down, rendered in the given order

### Single value & scoring

- `gauge-chart` — one value against a min/max range
- `radar-chart` — one entity scored across several dimensions at once (single series only, for now)

Every chart reads the active theme's colors automatically — no per-chart color configuration needed.

## Why there's no "point me at a data file" mode

Charts here take inline data only, not a `data.csv`/`data.json` URL fetched client-side. Real-world data mostly isn't sitting behind a plain public URL a browser can fetch directly — it's behind auth, a signed-URL expiry, or a proxy. Rather than build in an unauthenticated fetch that wouldn't work for real deployments anyway, plotting an existing dataset is left to a consumer's own chart type built on top of this package's shared renderer, fetching however fits their own auth setup.

## Coming soon

- Multi-series radar charts (overlay several entities on the same axes)
- Heatmap, treemap, and sankey charts (different data shape than the rest of this list)
- Smaller bundles — split per chart type instead of pulling in all of ECharts
