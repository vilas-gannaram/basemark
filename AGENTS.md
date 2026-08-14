Guidance for AI coding agents working in this repository. See [README.md](README.md) for what Basemark is and the package layout, [ARCHITECTURE.md](ARCHITECTURE.md) for the full technical design spec, and [VISION.md](VISION.md) for the intended consumption paths (direct library use, Claude Skills authoring, CLI-rendered shareable HTML) — this file only covers what changes how you should work here.

## Architecture decisions

Check new work against these before writing code.

- **Authoring syntax is `remark-directive`**, not raw HTML or markdown-it. Default new components to **leaf directives** (`::name{attrs}`); reach for container directives (`:::name{attrs}...:::`) only when there's real child content — see ARCH §3 for why.
- **Tiering model**: default new components to Tier 1 or Tier 2. Never make an author supply a raw data blob (Tier 4) except as an explicit escape hatch — see ARCH §2.
- **Web Components are the default render target** for anything published/shared (`bio`, `chem`, `common`). Native framework registration (`{ type: 'react', component: X }`) is an escape hatch for app-local, non-portable components only — see ARCH §6.
- **Registry is behind the manifest spec** — `packages/core/src/registry.ts`'s `ComponentDefinition` doesn't yet include `mimetypes` or `version` from the full contract (ARCH §5); don't assume that validation exists. Read `registry.ts` directly rather than trusting a shape described here — it keeps moving.

## Implementation patterns to follow

- **Custom elements from React render via a generic wrapper, not per-component code.** `packages/react`'s `MarkdownRenderer` wraps every resolved custom element with `@lit/react`'s `createComponent()` (looked up via `customElements.get(tagName)`), so it mounts as a real React component rather than a bare host tag. This works for any custom element regardless of how it was authored (no Lit dependency needed in the component itself) — don't write bespoke per-component React wrappers or reimplement a component's logic natively in React; extend the generic wrapper instead.
- **A custom element class must never be declared at module scope in `@basemark/core`.** `class X extends HTMLElement` evaluates `HTMLElement` the instant the class statement runs, not on first instantiation — and `packages/core`'s tests run in plain Node, no jsdom, no DOM globals at all. `error-element.ts`'s `registerErrorComponent()` defines its class *inside* the function, after a `typeof HTMLElement === 'undefined'` guard, specifically so `parse.ts` (which calls it) stays importable and callable from a Node-only test. Any future core-level custom element needs the same shape; domain packages (`bio`, `common`) don't have this constraint since nothing imports them into a Node test today.

## Pitfalls already hit once

- **`unified`'s `processor.runSync(tree)` silently drops the source text if you don't pass the same `VFile` you parsed with.** `parse.ts` used to call `processor.parse(source)` then `processor.runSync(mdastTree)` with no second argument — `runSync` then creates a fresh, valueless `VFile` of its own, so any plugin reading `file.value` (as `resolveDirectives` does, to slice out a directive's raw source) silently gets `undefined`. Construct one `VFile` and pass it to both `parse()` and `runSync(tree, file)`. This went unnoticed for a while because no test asserted on the `source` property's actual content — if you add a plugin that reads `file.value`, add a test that checks it's non-empty, not just that it exists.
- **The root `.gitignore` originally hid the whole `packages/` directory.** It was generated from a generic template and contained a NuGet rule (`**/[Pp]ackages/*`) that silently excluded every source package from git. It's now commented out — do not re-add a bare `packages/*` ignore rule.

## Tooling

- **Formatting is enforced by Prettier, not hand-applied or debated.** A Husky `pre-commit` hook runs `lint-staged` (Prettier then ESLint `--fix`) on staged files — see `.prettierrc.json`. Don't add stylistic rules to `configs/eslint-config` (it ends with `eslint-config-prettier` specifically to prevent that conflict), and don't hand-format code to "fix" something Prettier would just rewrite on commit.

## Status

Pre-alpha, but the core pipeline works end-to-end:

- **`@basemark/core`** — parses `remark-directive` markdown into a hast tree, validates props against each component's schema, and fails visibly via a registered `basemark-error` component (including for unclosed containers, which would otherwise silently swallow the rest of the document). Also auto-generates an AI-facing component prompt from the registry, and renders straight to real DOM with no framework via `renderMarkdown()` (built on `hast-util-to-dom`).
- **`@basemark/bio`** — first real Tier-2 component: `::locuszoom-assoc{chrom start end}`, wrapping LocusZoom.js.
- **`@basemark/common`** — first real components: `card`/`columns`/`tabs`, proving out the container-directive/Shadow-DOM-slot pattern (see `packages/common/README.md`).
- **`@basemark/react`** — renders the hast tree; every resolved custom element is wrapped generically via `@lit/react`'s `createComponent` (not per-component code), so it mounts as a real React component, not a bare host tag.
- **`examples/react`** and **`examples/vanilla`** exercise the React and no-framework render paths respectively, in a browser.

`packages/chem`, `packages/cli`, `packages/svelte`, `apps/docs` are still stubs — see `packages/bio`, `packages/common`, `packages/react`, and the `examples/*` packages for the patterns to extend.

Open design questions: ARCHITECTURE.md §10. Open questions specific to the consumption-paths vision: VISION.md.
