# CLAUDE.md

Guidance for Claude Code when working in this repository. See [README.md](README.md) for what Basemark is, the package layout, and commands. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design spec — this file only covers what changes how you should work here.

## Decisions that constrain implementation

- **Authoring syntax is `remark-directive`** (leaf `::name{attrs}`, container `:::name{attrs}...:::`, text `:name[label]{attrs}`) — not raw HTML, not markdown-it. Default new components to **leaf directives**; containers are reserved for things that genuinely need child content (cards, tabs, layouts), since an unclosed `:::` silently swallows the rest of the document.
- **Tiering model**: default every new component to Tier 1 (single ID, e.g. `::structure{pdbId="..."}`) or Tier 2 (2-4 short fields). Never make an author supply a raw data blob (Tier 4) except as an explicit escape hatch. Check new component proposals against this first.
- **Web Components are the default render target** for anything published/shared (`bio`, `chem`, `common`) — must work cross-framework and in raw HTML. Native framework registration (`{ type: 'react', component: X }`) is an escape hatch for app-local, non-portable components only.
- **Registry is behind the manifest spec**: `packages/core/src/registry.ts` stores `{ tag, schema }` today — `schema` is a flat prop-type/required map used for directive validation. The target shape also adds `mimetypes` and `version` (ARCHITECTURE.md §5) — not implemented, don't assume mimetype/version validation exists yet.
- **Custom elements from React render via a generic wrapper, not per-component code.** `packages/react`'s `MarkdownRenderer` wraps every resolved custom element with `@lit/react`'s `createComponent()` (looked up via `customElements.get(tagName)`), so it mounts as a real React component rather than a bare host tag. This works for any custom element regardless of how it was authored (no Lit dependency needed in the component itself) — don't write bespoke per-component React wrappers or reimplement a component's logic natively in React; extend the generic wrapper instead.

## Status: pre-alpha, core pipeline validated end-to-end

`packages/core` now has a real directive parser (`parse.ts`): a `remark-parse` + `remark-directive` + `remark-rehype` pipeline with a custom transform plugin that resolves directive nodes against the `ComponentRegistry`, coerces/validates props against each component's `schema`, and fails visibly (`basemark-error` hast node) on unknown directives or invalid props — never a silent content gap (ARCHITECTURE.md §3). `prompt.ts` auto-generates an AI-facing component reference from the registry (§5).

`packages/bio` has its first real component: `locuszoom-assoc` (`::locuszoom-assoc{chrom start end}`), a Tier-2 web component wrapping LocusZoom.js's `standard_association` layout with fixed internal data sources — only region props are exposed, per the tiering model. `packages/react`'s `MarkdownRenderer` is real (see the generic-wrapper bullet above). `apps/playground` is a working Vite app that exercises the full path (`core` → `react` → `bio`) in a browser.

That clears the "one end-to-end path" gate for `bio` and `react`/`playground`. `chem`, `svelte`, `cli`, `apps/docs` are still stubs — extend `bio`'s/`react`'s pattern when building those out, don't restart from scratch.

`examples/` and `experiments/` (described in ARCHITECTURE.md §9 as target structure) don't exist in this repo yet — removed until there's something real to demo or prototype.

Open questions: see ARCHITECTURE.md §10.

## Gotchas

- The root `.gitignore` was generated from a generic template and originally contained a NuGet rule (`**/[Pp]ackages/*`) that silently excluded the entire `packages/` directory from git. It's been commented out — do not re-add a bare `packages/*` ignore rule, it will hide this monorepo's real source packages.
