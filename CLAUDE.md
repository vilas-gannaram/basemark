# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Basemark renders markdown + directives (`::: callout`) into web components. Two layers:

- **Authors** (human or AI) write markdown with directive syntax.
- **Consumers** embed the rendered output in React, Svelte, Solid, or vanilla HTML.

`@basemark/core` parses markdown+directives and resolves each directive to a web-component tag via a `ComponentRegistry`. Domain packages (`bio`, `chem`, `common`) register components into that registry; framework packages (`react`, `svelte`) are thin bindings around it. Consumers can override any registered component (`registry.register(name, def, { override: true })`).

## Status: pre-alpha

Only `@basemark/core`'s `ComponentRegistry` (`packages/core/src/registry.ts`) is implemented. The directive parser itself, all web components, and the framework bindings are still `TODO` — see the stubs in `packages/core/src/index.ts` and `packages/react/src/index.tsx`. `bio`, `chem`, `svelte`, `cli`, `apps/docs`, and `apps/playground` are placeholder packages; don't build them out until the directive parser and one end-to-end path (core → react → a real component) is validated.

Known open question: SSR/hydration behavior of the web components (shadow DOM vs. light DOM, declarative shadow DOM support) is unresolved — needs a spike before the `react`/`svelte` bindings go beyond the stub stage.

## Layout

- `packages/core` — directive parser + `ComponentRegistry` (real)
- `packages/common`, `packages/bio`, `packages/chem` — domain component packages (stub)
- `packages/react`, `packages/svelte` — framework bindings (stub)
- `packages/cli` — build/render tooling (stub)
- `apps/docs`, `apps/playground` — docs site and live editor (stub)
- `configs/*` — shared eslint/tsconfig/vitest config, not published (currently stubs; packages don't extend them yet)

`examples/` and `experiments/` have been removed for now; re-add them later if needed.

## Commands

- Package manager: **pnpm** (`10.30.3`, workspace globs in `pnpm-workspace.yaml`)
- `pnpm install` — install all workspace packages
- `pnpm build` / `pnpm dev` / `pnpm check-types` / `pnpm test` — run via Turborepo across the workspace (`turbo.json`)

There is no lint or format tooling configured yet, and most `build`/`test` scripts are `echo "TODO"` placeholders in stub packages.

## Gotchas

- The root `.gitignore` was generated from a generic template and originally contained a NuGet rule (`**/[Pp]ackages/*`) that silently excluded the entire `packages/` directory from git. It's been commented out — do not re-add a bare `packages/*` ignore rule, it will hide this monorepo's real source packages.
