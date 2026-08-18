# @basemark/charts

Chart/plot components (ECharts) — a separate package per ARCHITECTURE.md §7's flag on heavy general-purpose dependencies.

## Built

- [x] `::bar-chart` — categories on x, numeric value on y.
- [x] `::line-chart` — same shape as bar, trend over an ordered sequence.
- [x] `::scatter-chart` — both axes numeric, no category concept.
- [x] `::pie-chart` — donut styling by default; proportions of a whole.
- [x] `::radar-chart` — one entity scored across several dimensions at once. Single series only (v1).
- [x] `::funnel-chart` — ordered stages narrowing down; renders in the given order, not resorted by value.
- [x] `::gauge-chart` — one value against a `min`/`max` range. Always exactly one value.

Every type takes data as inline comma-separated lists straight in the directive (ARCHITECTURE.md §2's Tier 3), no file needed: `bar-chart`/`line-chart`/`pie-chart`/`radar-chart`/`funnel-chart` use `labels`+`values`; `scatter-chart` uses `xValues`+`yValues` (no label concept, both axes numeric). e.g. `::bar-chart{labels="Jan,Feb,Mar" values="120,150,170"}`.

These normalize to the same `{x, y}` row shape (`chart.ts`'s `getLabelValueRows()`) before each type builds its own ECharts `option`. Shared renderer: `chart.ts`'s `createChartElement()`, same one-factory-many-callers shape as `@basemark/bio`'s `createLocusZoomElement`.

**Theming:** every chart reads `theme.css`'s `--chart-1`..`--chart-5` for series colors and `--foreground`/`--muted-foreground`/`--border` for text/axis lines — ECharts has no idea CSS custom properties exist, so `chart.ts`'s `themeOption()` reads their computed values and feeds them into the `option` on every render.

## Why no hosted-file mode

An earlier version also took `data` (a `.csv`/`.json` URL) + `x`/`y` field names, resolved with a raw client-side `fetch(url)`. Dropped because that pattern doesn't hold up outside a demo: real-world data mostly isn't sitting behind a plain public storage URL a browser can `fetch()` directly — it's behind auth, a signed-URL expiry, or a proxy, none of which a generic chart component should be guessing at. ARCHITECTURE.md §4 flags exactly this risk: client-side URL fetches of caller-supplied URLs are an SSRF surface, and embedded/inline data is the zero-trust default.

Rather than build a `core`-level fetch allowlist/proxy to make hosted URLs safe (unbuilt, cross-package work — see ARCHITECTURE.md §10), the answer here is extension: a consumer who wants to plot an existing dataset writes their own chart type on top of `chart.ts`'s `createChartElement()`/`defineChart()`, fetching however fits their own auth setup — signed URL, authenticated API call, server-side proxy, whatever's real for their deployment — instead of this package doing an opinionated unauthenticated fetch of a URL an author or an LLM supplied.

## Known gaps

- No raw ` ```echarts ` fence escape hatch — core has no fenced-code-block-to-component pipeline yet (same gap blocks Mermaid, see ARCHITECTURE.md §8/§4).
- Bundle isn't split — pulls in all of `echarts`, not just the chart types actually used.
- `radar-chart` is single-series only — no way to overlay multiple entities on the same axes yet.
- Heatmap/treemap/sankey and other non-tabular shapes aren't built — they need a genuinely different data model (grid triples, nested/linked data) than the flat `{x, y}` rows every chart here uses.
