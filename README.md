## Basemark

Markdown + directives → web components. Authors (human or AI) write markdown with a directive syntax; a framework-agnostic core resolves each directive to a web component, which consumers embed in React, Svelte, Solid, or plain HTML.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design spec and rationale.

### Status

Pre-alpha. Only `@basemark/core`'s component registry is implemented. The directive parser, web components, and framework bindings are still TODO — see `packages/core/src/index.ts` and `packages/react/src/index.tsx`.

### Layout

- `packages/core` — remark-directive parser + component registry (real, minimal)
- `packages/common` — table/chart/map/katex components (stub)
- `packages/bio`, `packages/chem` — domain component packages (stub, pending core validation)
- `packages/react`, `packages/svelte` — framework bindings (react has a minimal stub; svelte mirrors it once react is validated)
- `packages/cli` — build/render tooling (stub)
- `apps/docs`, `apps/playground` — docs site and live editor (stub)
- `configs/*` — shared eslint/tsconfig/vitest config, not published

### Commands

- Package manager: pnpm (`10.30.3`)
- `pnpm install` — install all workspace packages
- `pnpm build` / `pnpm dev` / `pnpm check-types` / `pnpm test` — run via Turborepo
