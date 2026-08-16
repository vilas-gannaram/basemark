# @basemark/cli

Build-time tooling for Basemark. First real command: `render` — resolves a markdown(+directives) file into one self-contained HTML file (VISION.md's third consumption path). Open the output in any browser: no server, no build step, no framework runtime.

## Usage

From source, via Bun (no compile step needed):

```sh
bun run packages/cli/src/index.ts render doc.md -o doc.html
```

Or build a standalone binary once and run that instead:

```sh
cd packages/cli
bun run build            # writes dist/basemark
./dist/basemark render doc.md -o doc.html
```

`dist/basemark` embeds the whole Bun runtime plus every dependency the CLI's import graph actually reaches — copy it anywhere (a different machine, a directory with no Bun install) and it still works standalone. It does **not** embed your markdown input; that's read from disk each time you run it.

## What gets resolved

`render` builds a registry from `@basemark/core` + `@basemark/common` only:

- `@basemark/bio` is **not** wired in yet. Its components (`structure`, `protvista`, the `locuszoom-*` family) import heavy vendor libraries — `3dmol`, `protvista-uniprot`, `locuszoom` — at module scope, which crashes outside a browser (confirmed: `SyntaxError: Missing 'default' export` importing `locuszoom` under plain Bun). Wiring bio in requires making those imports lazy (`await import(...)`, deferred until a real DOM is confirmed present) and making `registerBioComponents()` (and its callers) `async` — a larger, separate change from `@basemark/common`'s fix below.
- `@basemark/common`'s 12 components (`card`, `button`, `tabs`, `accordion`, `carousel`, `popover`, `video`, `audio`, `badge`, `alert`, `separator`, `columns`) are fully wired. Each one's `class X extends HTMLElement` is declared *inside* its `register*` function, behind a `typeof HTMLElement !== 'undefined'` guard — same pattern as `@basemark/core`'s `error-element.ts` (see AGENTS.md's "custom element class must never be declared at module scope" note). That's what makes it safe for this CLI to `import('@basemark/common')` under Bun with no browser present: the plain registry data (tag name, prop schema) is available even though the actual DOM class bodies are skipped.
- `@basemark/chem` is an empty stub — nothing to register yet.

An unknown directive, a failed prop-schema check, or an unclosed `:::` container all resolve to a visible `basemark-error` banner in the output (never a silent drop) — same "fail visibly" contract as every other consumption path (ARCHITECTURE.md §3).

## How a render actually happens

```
markdown source
   │  @basemark/core's parseMarkdown() (Bun, no DOM) — resolves directives
   │  against the registry, validates props
hast tree
   │  @basemark/core's renderMarkdownToHtml() (hast-util-to-html, no DOM
   │  needed either) — serializes to a plain HTML string
body markup
   │  wrapped with:
   │   - @basemark/core/theme.css's contents, inlined as a <style> tag
   │   - the pre-bundled component runtime (see below), inlined as a
   │     <script> tag
single .html file
```

The "component runtime" is a separate concern from the markup above: it's the actual browser-side JS that calls every `register*Components()` for its `customElements.define()` side effects, so the tags already present in the markup (`<basemark-card>`, etc.) upgrade into real interactive elements the moment a reader opens the file — no hydration, no client-side markdown re-parsing.

That runtime is **pre-bundled at CLI build time**, not per-render:

- `scripts/bundle-runtime.ts` runs Bun's bundler (`Bun.build()`, `target: 'browser'`) once against `src/runtime-entry.ts`, writing the result to `src/generated/runtime.js` (gitignored — regenerated, not committed). This runs automatically via this package's `postinstall` script, and again as the first step of its `build` script.
- `src/render.ts` pulls that file in via a **static** text import (`import runtimeJs from './generated/runtime.js' with { type: 'text' }`), the same mechanism used for `theme.css`.

This two-step split exists because of a real `bun build --compile` constraint: a compiled binary runs from an embedded virtual filesystem (`/$bunfs/...`), and `Bun.build()` needs real files on disk to bundle from — calling it *inside* a request handler (the original, simpler design) worked fine under `bun run` but crashed the moment it ran from inside the compiled `dist/basemark` binary (`FileNotFound: failed to open root directory: /$bunfs/root`). A **static** import, by contrast, is visible to Bun's own compiler ahead of time, so it gets embedded into the binary as a string constant — which is why the bundling has to happen *before* compilation, as a separate build-time script, rather than lazily inside `render()`.

## Known gaps

- `@basemark/bio` isn't wired in (see above) — real follow-up work, not a quick fix.
- No structural/schema linter yet (ARCHITECTURE.md §3's mitigation #3 for unclosed containers) — `render` will happily produce output containing `basemark-error` banners rather than fail the whole build; there's no `--strict`/exit-nonzero-on-error mode yet.
- No batch/static-site rendering (a directory of `.md` files → a directory of `.html` files) — only single-file `render` exists.
- No component scaffolding or registry-validation commands (ARCHITECTURE.md §7's fuller list of what this package is meant to grow into).
