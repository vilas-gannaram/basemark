## Basemark

Markdown + directives → web components. Authors (human or AI) write markdown with a directive syntax; a framework-agnostic core resolves each directive to a web component, which consumers embed in React, Svelte, Solid, or plain HTML.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the technical design.

### Who uses this

- **Direct library use in AI-powered content apps** (chat UIs, notebook tools) — import `core` + whichever domain packs you need, render via `@basemark/react` or no framework at all.
- **Claude Skills as an authoring surface** — a Skill emits Basemark directives instead of plain markdown, so its output can embed a real interactive viewer, not just describe one.
- **CLI renders a doc to one shareable static HTML file** — `@basemark/cli` resolves markdown(+directives) into a single self-contained `.html`, no build step needed.

### Packages

| Group | Package | What it does |
| --- | --- | --- |
| Core | `packages/core` | remark-directive parser + component registry + AI prompt generation + vanilla DOM renderer |
| Packs | `packages/bio` | domain components; first real one is `locuszoom-assoc` (LocusZoom.js) |
| Packs | `packages/common` | general-purpose/layout components; real: `card`, `columns`, `tabs` (see its README) |
| Packs | `packages/charts` | chart/plot components (ECharts): `bar-chart`/`line-chart`/`scatter-chart`/`pie-chart`/`radar-chart`/`funnel-chart`/`gauge-chart` (see `packages/charts/README.md`) |
| Packs | `packages/chem` | domain component package (stub) |
| Wrappers | `packages/react` | framework binding: parses markdown, renders resolved custom elements as generically-wrapped React components |
| Wrappers | `packages/svelte` | framework binding (stub, mirrors react's pattern once needed) |
| Tooling | `packages/cli` | build/render tooling; `basemark render` resolves a markdown(+directives) file to one self-contained HTML file (see `packages/cli/README.md`) |
