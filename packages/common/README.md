# @basemark/common

General-purpose and layout/container components — not domain-specific. See [ARCHITECTURE.md](../../ARCHITECTURE.md) §8.

## Layout/container — built

- [x] `:::card{title="..."}` — bordered container, one default slot.
- [x] `:::columns{cols="..."}` — CSS Grid, one child block per cell.
- [x] `:::tabs` / `:::tab-panel{label="..."}` — reads each panel's `label` off its light-DOM children, toggles `hidden` — handles a dynamic tab count without named slots.

All three zero the vertical margin a nested component would otherwise add (`::slotted()` overrides).

## shadcn/ui-inspired components — built

Plain custom elements styled against `theme.css`'s shadcn-compatible tokens — no Tailwind, no React dependency.

- [x] `:button[Label]{variant size href}` — text directive; `<a>` if `href` set, else `<button>`.
- [x] `:badge[Label]{variant}` — text directive.
- [x] `:::alert{variant title} ... :::` — callout box.
- [x] `::separator{orientation}` — divider line.
- [x] `:::accordion` / `:::accordion-item{label}` — same pattern as `tabs`.
- [x] `:::carousel` — CSS `scroll-snap` track + prev/next buttons.
- [x] `:::popover{trigger side} ... :::` — click-to-open panel, `position: fixed` (not `absolute`, so an `overflow: hidden` ancestor can't clip it). Closes on outside click / Escape.
- [x] **table** — plain GFM pipe-table syntax, not a directive. Themed globally in `theme.css`.

More of shadcn's set (dialog, dropdown-menu, tooltip) can follow the same pattern — see `card.ts` for the base custom-element/registry shape.

## Media embeds — built

Tier 0: author writes just the ordinary page URL, the component detects the provider. An unrecognized URL renders an inline error (not `basemark-error` — that's for directive-level failures, this is a runtime data problem).

- [x] `::video{url}` — YouTube or Vimeo, any normal share URL shape.
- [x] `::audio{url}` — Spotify or SoundCloud.

Self-hosted `<video>`/`<audio>` and other providers (X, Bluesky, oEmbed) are out of scope for now.

## Not built yet

- [ ] Mermaid family (`<mermaid-diagram>` + `::gantt`/`::flowchart`/etc. translators)
- [ ] Vega-Lite/Plotly charts
- [ ] KaTeX
- [ ] Sortable tables (plain GFM tables render; sort/filter doesn't)
- [ ] Maps (MapLibre/Leaflet)
- [ ] Citations (BibTeX)
- [ ] JSON/tree viewers

---

Bio components (`protvista`, `structure`, `locuszoom-*`) are a separate package — see `packages/bio`.
