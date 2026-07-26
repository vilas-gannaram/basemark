# @basemark/common

General-purpose and layout/container components — not domain-specific to bio or chem. See [ARCHITECTURE.md](../../ARCHITECTURE.md) §8 for the tiering rationale and the original candidate list this package works from.

## Status vs. the original plan

ARCHITECTURE.md §8 split this package's scope into two buckets: layout/container components (needed to prove the container-directive → hast-nesting → Shadow-DOM-`<slot>` path actually works, since every component elsewhere in the repo is a leaf directive) and general-purpose leaf components (charts, tables, diagrams, etc.). Only the first bucket has been started:

- [x] `:::card{title="..."}` — bordered container with an optional title, single default slot. Built first, per §8's recommendation, as the minimal case for proving slot projection end-to-end.
- [x] `:::columns{cols="..."}` — CSS Grid layout, one direct child block per cell. No chrome of its own (unlike card) — purely a layout primitive.
- [x] `:::tabs` / `:::tab-panel{label="..."}` — tabbed container. Deviates from §8's "named slots" phrasing: instead of one named `<slot>` per tab (which would need a static tab count), `tabs` reads each `tab-panel`'s `label` attribute off its light-DOM children and toggles visibility imperatively via the `hidden` attribute, through a single default slot. Handles an arbitrary, dynamic number of tabs with less machinery than named slots would.

All three deliberately zero the vertical margin a nested bio/chem component would otherwise contribute (`::slotted()` overrides in each component's own shadow styles) — see each file's comments for why that needs `!important` to actually win.

Everything below is still exactly as originally planned in §8 — nothing else in this package has been started.

## General-purpose (untiered in ARCHITECTURE.md — leaf directives, Tier 1/2 by nature)

- [ ] Mermaid family — one shared `<mermaid-diagram>` renderer; `::gantt{...}`, `::flowchart{...}`, `::fishbone{...}` etc. as thin translators to generated Mermaid source (see §8's Mermaid design note)
- [ ] Vega-Lite/Plotly charts
- [ ] KaTeX
- [ ] Sortable tables
- [ ] Maps (MapLibre/Leaflet)
- [ ] Citations (BibTeX)
- [ ] JSON/tree viewers
- [ ] Media embeds

---

Bio components (protvista, structure, the locuszoom-\* suite) are a separate package — see `packages/bio`.
