# CLAUDE.md

Guidance for Claude Code when working in this repository. See [README.md](README.md) for what Basemark is, the package layout, and commands. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design spec — this file only covers what changes how you should work here.

## Decisions that constrain implementation

- **Authoring syntax is `remark-directive`** (leaf `::name{attrs}`, container `:::name{attrs}...:::`, text `:name[label]{attrs}`) — not raw HTML, not markdown-it. Default new components to **leaf directives**; containers are reserved for things that genuinely need child content (cards, tabs, layouts), since an unclosed `:::` silently swallows the rest of the document.
- **Tiering model**: default every new component to Tier 1 (single ID, e.g. `::structure{pdbId="..."}`) or Tier 2 (2-4 short fields). Never make an author supply a raw data blob (Tier 4) except as an explicit escape hatch. Check new component proposals against this first.
- **Web Components are the default render target** for anything published/shared (`bio`, `chem`, `common`) — must work cross-framework and in raw HTML. Native framework registration (`{ type: 'react', component: X }`) is an escape hatch for app-local, non-portable components only.
- **Registry is behind the manifest spec**: `packages/core/src/registry.ts` only stores `{ tag }` today. The target shape (`schema`, `mimetypes`, `version`, per ARCHITECTURE.md §5) isn't implemented — don't assume schema/mimetype validation exists yet.

## Status: pre-alpha

Only `ComponentRegistry` (`packages/core/src/registry.ts`) is implemented, and it's a partial version of the manifest contract above. The directive parser, web components, and framework bindings are all `TODO` — see stubs in `packages/core/src/index.ts` and `packages/react/src/index.tsx`. No `remark-directive`/`unified`/`hast` dependencies are installed yet. Don't build out `bio`, `chem`, `svelte`, `cli`, `apps/docs`, `apps/playground` until the directive parser and one end-to-end path (core → react → a real component) is validated.

`examples/` and `experiments/` (described in ARCHITECTURE.md §9 as target structure) don't exist in this repo yet — removed until there's something real to demo or prototype.

Open questions: see ARCHITECTURE.md §10.

## Gotchas

- The root `.gitignore` was generated from a generic template and originally contained a NuGet rule (`**/[Pp]ackages/*`) that silently excluded the entire `packages/` directory from git. It's been commented out — do not re-add a bare `packages/*` ignore rule, it will hide this monorepo's real source packages.
