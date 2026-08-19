Guidance for AI agents working in this repo. See [README.md](README.md) for what Basemark is and who consumes it, [ARCHITECTURE.md](ARCHITECTURE.md) for the full design spec. This file is just what changes how you work here.

## Dev Conventions

- **Interfaces are `I`-prefixed, type aliases are `T`-prefixed** (`IPropSchema`, `TComponentDefinition`), including inside ambient `declare module` blocks.
- **Every type/interface declaration lives at the bottom of its file**, after the functions/classes/consts that use it — TypeScript hoists them for type-checking, so declaration order never matters to the compiler.
- **File and folder names are kebab-case.**
- **Module-level constants are `SCREAMING_SNAKE_CASE`** (`OBSERVED_ATTRS`, `MYVARIANT_QUERY_BASE`).
- **Every component's custom-element tag constant is `<NAME>_TAG`, its registration function `register<Name>`** (`CARD_TAG`/`registerCard`, `BAR_CHART_TAG`/`registerBarChart`).
- Exceptions, both forced by tooling rather than a style choice:
  - Astro's `interface Props` in `.astro` frontmatter must stay named exactly `Props` — `Astro.props`'s type inference depends on that name.
  - Root docs (`README.md`, `AGENTS.md`, `ARCHITECTURE.md`, `CLAUDE.md`) stay uppercase — GitHub special-cases `README.md`, and `CLAUDE.md` is the exact filename Claude Code auto-loads.

## Implementation patterns

- **React wrapping is generic, not per-component.** `packages/react`'s `MarkdownRenderer` wraps every custom element via `@lit/react`'s `createComponent()`. Extend the generic wrapper, don't hand-write per-component React versions.
- **Never declare a custom element class at module scope.** `class X extends HTMLElement` touches `HTMLElement` the moment the file loads — breaks any DOM-less import (Node tests, the CLI under Bun). Declare the class _inside_ its `register*` function, behind `typeof HTMLElement !== 'undefined'`. See `core/error-element.ts` for the pattern; every `common`/`bio` component follows it.
- **`bio`'s vendor libraries need a dynamic import too, not just the guard.** `3dmol`/`protvista-uniprot`/`locuszoom` crash on load outside a browser regardless of any guard around your own class. Defer with `await import(...)` inside the same guard — makes the `register*` function `async`.
- **`registry.ts`'s `TComponentDefinition` is behind ARCHITECTURE.md §5's manifest spec** (no `version` field yet). Read the file directly — it moves.

## Pitfalls already hit

- `unified`'s `runSync(tree)` drops the source text unless you pass the same `VFile` you parsed with. Always `runSync(tree, file)`.
- Don't re-add a bare `packages/*` rule to `.gitignore` — an old NuGet template rule once hid the whole `packages/` dir from git.
- `Bun.build()` can split one entry point into multiple output chunks (e.g. a real `.css` import becomes its own asset chunk). Write every `result.outputs` entry, not just `outputs[0]` — see `packages/cli/scripts/bundle-runtime.ts`.
- A bare `word:word` in authored prose (genomic coordinates like `chr10:114550452`, variant IDs like `10:114758349_C/T`, timestamps) is misparsed by `remark-directive` as a text directive and renders as an "unknown component" `basemark-error`. When writing or generating example/demo markdown, wrap any such colon-separated literal in backticks. See ARCHITECTURE.md §3's second "Known failure mode".

## Tooling

Prettier + ESLint run via a Husky pre-commit hook (`lint-staged`). Don't hand-format or add stylistic ESLint rules — Prettier owns that.

## Status

Pre-alpha, core pipeline works end-to-end — see README.md's package table for what each package is. `packages/chem` and `packages/svelte` are still stubs; everything else listed there is real.

Open questions: ARCHITECTURE.md §9.
