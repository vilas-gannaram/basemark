# @basemark/charts

Chart/plot components (ECharts) — a separate package per ARCHITECTURE.md §7's flag on heavy general-purpose dependencies.

## Built

- [x] `::bar-chart` — categories on x, numeric value on y.
- [x] `::line-chart` — same shape as bar, trend over an ordered sequence.
- [x] `::scatter-chart` — both axes numeric, no category concept.
- [x] `::pie-chart` — donut styling by default; proportions of a whole.
- [x] `::radar-chart` — one entity scored across several dimensions at once. Single series only (v1).
- [x] `::funnel-chart` — ordered stages narrowing down; renders in the given order, not resorted by value.
- [x] `::gauge-chart` — one value against a `min`/`max` range. No data-URL mode — always exactly one value.

Every type except `gauge-chart` takes data two ways (ARCHITECTURE.md §2's tiers):

- **Inline (Tier 3)** — comma-separated lists straight in the directive, no file needed. `bar-chart`/`line-chart`/`pie-chart`/`radar-chart`/`funnel-chart` use `labels`+`values`; `scatter-chart` uses `xValues`+`yValues` (no label concept, both axes numeric). e.g. `::bar-chart{labels="Jan,Feb,Mar" values="120,150,170"}`.
- **Hosted file (Tier 2)** — `data` (a `.csv`/`.json` URL) + `x`/`y` (field names). e.g. `::bar-chart{data="/sales.csv" x="month" y="revenue"}`.

Both normalize to the same `{x, y}` row shape (`chart.ts`'s `getLabelValueRows()`) before each type builds its own ECharts `option`. Shared renderer: `chart.ts`'s `createChartElement()`, same one-factory-many-callers shape as `@basemark/bio`'s `createLocusZoomElement`.

**Theming:** every chart reads `theme.css`'s `--chart-1`..`--chart-5` for series colors and `--foreground`/`--muted-foreground`/`--border` for text/axis lines — ECharts has no idea CSS custom properties exist, so `chart.ts`'s `themeOption()` reads their computed values and feeds them into the `option` on every render.

## Known gaps

- CSV parsing is a bare `,`-split — no quoted-field/embedded-comma support.
- No raw ` ```echarts ` fence escape hatch — core has no fenced-code-block-to-component pipeline yet (same gap blocks Mermaid, see ARCHITECTURE.md §8/§4).
- Not wired into `@basemark/cli` yet.
- Bundle isn't split — pulls in all of `echarts`, not just the chart types actually used.
- `radar-chart` is single-series only — no way to overlay multiple entities on the same axes yet.
- Heatmap/treemap/sankey and other non-tabular shapes aren't built — they need a genuinely different data model (grid triples, nested/linked data) than the flat `{x, y}` rows every chart here uses.
