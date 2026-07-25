## Basemark

Markdown + directives → web components. Authors (human or AI) write markdown with a directive syntax; a framework-agnostic core resolves each directive to a web component, which consumers embed in React, Svelte, Solid, or plain HTML.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full technical design spec and rationale, and [VISION.md](VISION.md) for who's meant to consume this and how (AI-powered content apps, Claude Skills authoring, CLI-rendered shareable HTML).

### Status

Pre-alpha, but the core pipeline is now validated end-to-end: `@basemark/core` parses `remark-directive` markdown into a hast tree (with schema-based prop validation and a "fail visibly" error node for unknown/invalid directives), and can auto-generate an AI-facing component prompt from the registry. `@basemark/bio` has its first real Tier-2 component (`::locuszoom-assoc{chrom start end}`, wrapping LocusZoom.js). `@basemark/react` renders that hast tree — every resolved custom element is wrapped generically (via `@lit/react`'s `createComponent`, not per-component code) so it mounts as a real React component, not a bare host tag. `apps/playground` is a working Vite app exercising the whole path in a browser.

`packages/common`, `packages/chem`, `packages/cli`, `packages/svelte`, `apps/docs` are still stubs — see `packages/bio` and `packages/react` for the now-validated pattern to extend.

### Layout

- `packages/core` — remark-directive parser + component registry + AI prompt generation (real)
- `packages/bio` — domain components; first real one is `locuszoom-assoc` (LocusZoom.js)
- `packages/common`, `packages/chem` — domain component packages (stub)
- `packages/react` — framework binding (real: parses markdown, renders resolved custom elements as generically-wrapped React components)
- `packages/svelte` — framework binding (stub, mirrors react's pattern once needed)
- `packages/cli` — build/render tooling (stub)
- `apps/playground` — live demo app (real, Vite + React)
- `apps/docs` — docs site (stub)
- `configs/*` — shared eslint/tsconfig/vitest config, not published

### Commands

- Package manager: pnpm (`10.30.3`)
- `pnpm install` — install all workspace packages
- `pnpm build` / `pnpm dev` / `pnpm check-types` / `pnpm test` — run via Turborepo
