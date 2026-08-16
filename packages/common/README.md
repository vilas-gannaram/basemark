# @basemark/common

General-purpose and layout/container components — not domain-specific to bio or chem. See [ARCHITECTURE.md](../../ARCHITECTURE.md) §8 for the tiering rationale and the original candidate list this package works from.

## Status vs. the original plan

ARCHITECTURE.md §8 split this package's scope into two buckets: layout/container components (needed to prove the container-directive → hast-nesting → Shadow-DOM-`<slot>` path actually works, since every component elsewhere in the repo is a leaf directive) and general-purpose leaf components (charts, tables, diagrams, etc.). Only the first bucket has been started:

- [x] `:::card{title="..."}` — bordered container with an optional title, single default slot. Built first, per §8's recommendation, as the minimal case for proving slot projection end-to-end.
- [x] `:::columns{cols="..."}` — CSS Grid layout, one direct child block per cell. No chrome of its own (unlike card) — purely a layout primitive.
- [x] `:::tabs` / `:::tab-panel{label="..."}` — tabbed container. Deviates from §8's "named slots" phrasing: instead of one named `<slot>` per tab (which would need a static tab count), `tabs` reads each `tab-panel`'s `label` attribute off its light-DOM children and toggles visibility imperatively via the `hidden` attribute, through a single default slot. Handles an arbitrary, dynamic number of tabs with less machinery than named slots would.

All three deliberately zero the vertical margin a nested bio/chem component would otherwise contribute (`::slotted()` overrides in each component's own shadow styles) — see each file's comments for why that needs `!important` to actually win.

## shadcn/ui-inspired components

Visual/interactive primitives styled after [shadcn/ui](https://ui.shadcn.com), reimplemented from scratch as plain custom elements against the shadcn-compatible CSS custom properties already defined in `@basemark/core`'s `theme.css` (`--primary`, `--radius`, `--ring`, etc.) — no Tailwind, no copied shadcn source, no React dependency. Each ships as its own web component so it renders identically across every consumption path (React, Svelte, plain HTML), per ARCHITECTURE.md §6.

- [x] `:button[Label]{variant="..." size="..." href="..."}` — text directive (inline, sits in a sentence); renders `<a>` when `href` is set, otherwise `<button>`.
- [x] `:badge[Label]{variant="..."}` — text directive; small inline status label.
- [x] `:::alert{variant="..." title="..."} ... :::` — container directive; callout box with an optional title and markdown body.
- [x] `::separator{orientation="horizontal|vertical"}` — leaf directive; themed divider line.
- [x] `:::accordion` / `:::accordion-item{label="..."}` — collapsible-section container. Same tabs.ts shape: a single default slot, `accordion` reads each item's `label` off its light-DOM children and toggles an `open` attribute; opening one item closes any other.
- [x] `:::carousel` — horizontally scrollable, snap-aligned slide track (one direct child block per slide, `columns.ts`-style) plus prev/next buttons. Sliding is pure CSS `scroll-snap`; JS only drives the two nav buttons — no swipe/autoplay/drag logic.
- [x] `:::popover{trigger="..." side="..."} ... :::` — container directive; click-to-open panel anchored to a generated trigger button. Positioned via `position: fixed` computed from the trigger's `getBoundingClientRect()`, not `position: absolute` — an ancestor with `overflow: hidden` (e.g. an accordion item's collapsing body) would otherwise clip an absolutely-positioned panel regardless of the shadow boundary. Closes on outside click or Escape.

Also: **table** — plain GFM pipe-table syntax (`| a | b |`), not a directive. `remark-gfm` is now wired into `@basemark/core`'s `parse.ts` pipeline (it was documented in ARCHITECTURE.md §4 but not actually installed before), and the resulting `<table>` is themed globally in `theme.css`, the same way plain `h1`-`h6`/`p`/`ul` markdown is — it's ordinary light-DOM output, not a shadow-DOM component, so no new directive/tag was needed.

More of shadcn's set (dialog, dropdown-menu, tooltip, ...) can follow the same pattern — see `button.ts`/`badge.ts`/`alert.ts`/`accordion.ts`/`popover.ts` for the leaf/text/container directive choice per component's shape, and `card.ts` for the underlying custom-element/shadow-DOM/registry pattern all of these extend.

## Media embeds

Tier 0 (ARCHITECTURE.md §2) — the author writes nothing but the video/track's ordinary page URL; the component detects the provider and builds the real embeddable iframe URL itself. An unrecognized URL renders an inline error message (not a silent blank box, not a `basemark-error` — that's reserved for directive-level failures in core, this is a runtime data problem inside an otherwise-valid component).

- [x] `::video{url="..."}` — YouTube or Vimeo, from any of their normal page/share URL shapes (`youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, `vimeo.com/`). Renders a 16:9 responsive iframe.
- [x] `::audio{url="..."}` — Spotify (track/album/playlist/episode/show) or SoundCloud. Spotify needs a `(type, id)` pair parsed out of the URL to build its `/embed/` path; SoundCloud's player accepts the whole original URL directly via a query param, so that branch passes it through instead of extracting an ID.

Self-hosted `<video>`/`<audio>` (Tier 3, a direct file URL with no provider) and other providers (Twitter/X, Bluesky, generic oEmbed) are deliberately out of scope for this pass — YouTube/Vimeo + Spotify/SoundCloud covers the Tier-0 "just a URL" case for what this repo's own example content (a protocol walkthrough, a lab recording) would actually embed.

Everything below is still exactly as originally planned in §8 — nothing else in this package has been started.

## General-purpose (untiered in ARCHITECTURE.md — leaf directives, Tier 1/2 by nature)

- [ ] Mermaid family — one shared `<mermaid-diagram>` renderer; `::gantt{...}`, `::flowchart{...}`, `::fishbone{...}` etc. as thin translators to generated Mermaid source (see §8's Mermaid design note)
- [ ] Vega-Lite/Plotly charts
- [ ] KaTeX
- [ ] Sortable tables (plain GFM tables now render — see shadcn/ui-inspired section above; sorting/filtering behavior is still unbuilt)
- [ ] Maps (MapLibre/Leaflet)
- [ ] Citations (BibTeX)
- [ ] JSON/tree viewers

---

Bio components (protvista, structure, the locuszoom-\* suite) are a separate package — see `packages/bio`.
