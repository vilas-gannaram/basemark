# CLAUDE.md

Guidance for Claude Code when working in this repository. See [README.md](README.md) for what Basemark is, the package layout, commands, and current implementation status. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full technical design spec, and [VISION.md](VISION.md) for the intended consumption paths (direct library use, Claude Skills authoring, CLI-rendered shareable HTML) — this file only covers what changes how you should work here.

## Decisions that constrain implementation

- **Authoring syntax is `remark-directive`** (leaf `::name{attrs}`, container `:::name{attrs}...:::`, text `:name[label]{attrs}`) — not raw HTML, not markdown-it. Default new components to **leaf directives**; containers are reserved for things that genuinely need child content (cards, tabs, layouts), since an unclosed `:::` silently swallows the rest of the document.
- **Tiering model**: default every new component to Tier 1 (single ID, e.g. `::structure{pdbId="..."}`) or Tier 2 (2-4 short fields). Never make an author supply a raw data blob (Tier 4) except as an explicit escape hatch. Check new component proposals against this first.
- **Web Components are the default render target** for anything published/shared (`bio`, `chem`, `common`) — must work cross-framework and in raw HTML. Native framework registration (`{ type: 'react', component: X }`) is an escape hatch for app-local, non-portable components only.
- **Registry is behind the manifest spec**: `packages/core/src/registry.ts`'s `ComponentDefinition` doesn't yet include `mimetypes` or `version` from the full manifest contract (ARCHITECTURE.md §5) — don't assume mimetype/version validation exists. (Don't hardcode the rest of the shape here either — read `registry.ts` directly; it's evolved past a bare `{ tag, schema }` since this bullet was written and will keep moving.)
- **Custom elements from React render via a generic wrapper, not per-component code.** `packages/react`'s `MarkdownRenderer` wraps every resolved custom element with `@lit/react`'s `createComponent()` (looked up via `customElements.get(tagName)`), so it mounts as a real React component rather than a bare host tag. This works for any custom element regardless of how it was authored (no Lit dependency needed in the component itself) — don't write bespoke per-component React wrappers or reimplement a component's logic natively in React; extend the generic wrapper instead.

## Status

Tracked in one place only: see README.md's "Status" section for what's currently real vs. stub. Don't duplicate it here — this file drifted out of sync with the actual package contents the last time it tried. Open design questions: ARCHITECTURE.md §10. Open questions specific to the consumption-paths vision: VISION.md.

`examples/` and `experiments/` (described in ARCHITECTURE.md §9 as target structure) don't exist in this repo yet — removed until there's something real to demo or prototype.

## Gotchas

- The root `.gitignore` was generated from a generic template and originally contained a NuGet rule (`**/[Pp]ackages/*`) that silently excluded the entire `packages/` directory from git. It's been commented out — do not re-add a bare `packages/*` ignore rule, it will hide this monorepo's real source packages.
