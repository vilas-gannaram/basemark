Guidance for AI agents working in this repo. See [README.md](README.md) for what Basemark is, [ARCHITECTURE.md](ARCHITECTURE.md) for the full design spec, [VISION.md](VISION.md) for who consumes it. This file is just what changes how you work here.

## Architecture decisions

- Authoring syntax is `remark-directive`. Default to leaf directives (`::name{attrs}`); use container directives (`:::name...:::`) only for real child content. ARCH §3.
- Tiering: default new components to Tier 1/2 (short identifier in, component fetches/derives the rest). Tier 4 (raw data blob) is an escape hatch, not the default. ARCH §2.
- Web Components are the default render target for `bio`/`chem`/`common`. Native framework registration (`{ type: 'react', component: X }`) is only for app-local, non-portable components. ARCH §6.
- `registry.ts`'s `ComponentDefinition` is behind the full manifest spec (no `mimetypes`/`version` yet). Read the file directly — it moves.

## Implementation patterns

- **React wrapping is generic, not per-component.** `packages/react`'s `MarkdownRenderer` wraps every custom element via `@lit/react`'s `createComponent()`. Extend the generic wrapper, don't hand-write per-component React versions.
- **Never declare a custom element class at module scope.** `class X extends HTMLElement` touches `HTMLElement` the moment the file loads — breaks any DOM-less import (Node tests, the CLI under Bun). Declare the class *inside* its `register*` function, behind `typeof HTMLElement !== 'undefined'`. See `core/error-element.ts` for the pattern; every `common`/`bio` component follows it.
- **`bio`'s vendor libraries need a dynamic import too, not just the guard.** `3dmol`/`protvista-uniprot`/`locuszoom` crash on load outside a browser regardless of any guard around your own class. Defer with `await import(...)` inside the same guard — makes the `register*` function `async`.

## Pitfalls already hit

- `unified`'s `runSync(tree)` drops the source text unless you pass the same `VFile` you parsed with. Always `runSync(tree, file)`.
- Don't re-add a bare `packages/*` rule to `.gitignore` — an old NuGet template rule once hid the whole `packages/` dir from git.
- `Bun.build()` can split one entry point into multiple output chunks (e.g. a real `.css` import becomes its own asset chunk). Write every `result.outputs` entry, not just `outputs[0]` — see `packages/cli/scripts/bundle-runtime.ts`.

## Tooling

Prettier + ESLint run via a Husky pre-commit hook (`lint-staged`). Don't hand-format or add stylistic ESLint rules — Prettier owns that.

## Status

Pre-alpha, core pipeline works end-to-end:

- **`@basemark/core`** — parses `remark-directive` markdown to hast, validates props, fails visibly via `basemark-error`. Renders to real DOM (`renderMarkdown()`) or a plain string (`renderMarkdownToHtml()`).
- **`@basemark/bio`** — 8 components (`structure`, `protvista`, `locuszoom-*`), wrapping 3Dmol.js/protvista-uniprot/LocusZoom.js.
- **`@basemark/common`** — 12 components (`card`, `button`, `tabs`, etc.) — see `packages/common/README.md`.
- **`@basemark/charts`** — `bar-chart`/`line-chart`/`scatter-chart`/`pie-chart`/`radar-chart`/`funnel-chart`/`gauge-chart` (ECharts), a separate package per ARCH §7's heavy-dependency flag — see `packages/charts/README.md`.
- **`@basemark/react`** — mounts the hast tree as real React components.
- **`@basemark/cli`** — `basemark render doc.md -o doc.html`, one self-contained HTML file. Ships as a standalone binary (`bun build --compile`). Splits its component runtime per domain so a doc only pays for what it uses — see `packages/cli/README.md`.
- **`examples/react`** / **`examples/vanilla`** — the two render paths, live in a browser.
- **`apps/docs`** — end-user docs site (Astro, static, GitHub Pages). Dogfoods `@basemark/core`: narrative pages render real Basemark markdown via `renderMarkdownToHtml()`; component reference pages are generated straight from the registry, not hand-written — see `apps/docs/README.md`.

`packages/chem`, `packages/svelte` are still stubs.

Open questions: ARCHITECTURE.md §10, VISION.md.
