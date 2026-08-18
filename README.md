## Basemark

Markdown + directives → web components. Authors (human or AI) write markdown with a directive syntax; a framework-agnostic core resolves each directive to a web component, which consumers embed in React, Svelte, Solid, or plain HTML.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the technical design, and [VISION.md](VISION.md) for who consumes this and how (AI-powered content apps, Claude Skills authoring, CLI-rendered shareable HTML).

### Packages

- `packages/core` — remark-directive parser + component registry + AI prompt generation + vanilla DOM renderer
- `packages/bio` — domain components; first real one is `locuszoom-assoc` (LocusZoom.js)
- `packages/common` — general-purpose/layout components; real: `card`, `columns`, `tabs` (see its README)
- `packages/chem` — domain component package (stub)
- `packages/charts` — chart/plot components (ECharts): `bar-chart`, `line-chart`, `scatter-chart`, `pie-chart`, `radar-chart`, `funnel-chart`, `gauge-chart` (see `packages/charts/README.md`)
- `packages/react` — framework binding: parses markdown, renders resolved custom elements as generically-wrapped React components
- `packages/svelte` — framework binding (stub, mirrors react's pattern once needed)
- `packages/cli` — build/render tooling; `basemark render` resolves a markdown(+directives) file to one self-contained HTML file (see `packages/cli/README.md`)
- `apps/docs` — docs site (stub)
- `examples/vanilla` — direct `@basemark/core` usage with no framework (Vite + `renderMarkdown()`)
- `examples/react` — `@basemark/react` usage in the browser (Vite + React)
- `configs/*` — shared eslint/tsconfig/vitest config, not published
