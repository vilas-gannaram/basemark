## Basemark

Markdown + directives to web components. Authors (human or AI) write markdown with directive syntax; a framework-agnostic core parses it into web components, which consumers embed in React, Svelte, Solid, or vanilla HTML.

### Layout

- `packages/core` — remark-directive parser + component registry (real, minimal)
- `packages/common` — table/chart/map/katex components (stub)
- `packages/bio`, `packages/chem` — domain component packages (stub, pending core validation)
- `packages/react`, `packages/svelte` — framework bindings (react has a minimal stub; svelte mirrors it once react is validated)
- `packages/cli` — build/render tooling (stub)
- `apps/docs`, `apps/playground` — docs site and live editor (stub)
- `examples/*` — per-framework integration demos; `vanilla-html` is the zero-build proof point
- `experiments/` — POCs, no stability or deprecation guarantees, nothing else may depend on them
- `configs/*` — shared eslint/tsconfig/vitest config, not published

### Status

Pre-alpha. Only `@basemark/core`'s component registry is implemented. The directive parser, web components, and framework bindings are not yet built — see TODOs in `packages/core/src/index.ts` and `packages/react/src/index.tsx`.
