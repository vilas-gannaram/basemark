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

`render` builds a registry from `@basemark/core` + `@basemark/common` + `@basemark/bio`:

- `@basemark/common`'s 12 components (`card`, `button`, `tabs`, `accordion`, `carousel`, `popover`, `video`, `audio`, `badge`, `alert`, `separator`, `columns`) are fully wired. Each one's `class X extends HTMLElement` is declared *inside* its `register*` function, behind a `typeof HTMLElement !== 'undefined'` guard — same pattern as `@basemark/core`'s `error-element.ts` (see AGENTS.md's "custom element class must never be declared at module scope" note). That's what makes it safe for this CLI to `import('@basemark/common')` under Bun with no browser present: the plain registry data (tag name, prop schema) is available even though the actual DOM class bodies are skipped.
- `@basemark/bio`'s 8 components (`structure`, `protvista`, the `locuszoom-*` family) are also fully wired, one level further than `common`: each one's vendor library (`3dmol`, `protvista-uniprot`, `locuszoom`) is *dynamically* imported (`await import(...)`, not a static top-level `import`), deferred behind the same DOM guard — confirmed necessary, not just belt-and-suspenders: each library genuinely crashes on load outside a browser (`window is not defined`, `HTMLElement is not defined`, `d3 is not defined`, respectively). That's why every `register*` function in `@basemark/bio` is `async`, and why `buildRegistry()` here `await`s `registerBioComponents()`.
- `@basemark/chem` is an empty stub — nothing to register yet.

An unknown directive, a failed prop-schema check, or an unclosed `:::` container all resolve to a visible `basemark-error` banner in the output (never a silent drop) — same "fail visibly" contract as every other consumption path (ARCHITECTURE.md §3).

## How a render actually happens

```
markdown source
   │  @basemark/core's parseMarkdown() (Bun, no DOM) — resolves directives
   │  against the registry, validates props
hast tree
   │  hast-util-to-html (no DOM needed either) — serializes to a plain
   │  HTML string
body markup
   │  wrapped with:
   │   - @basemark/core/theme.css's contents, inlined as a <style> tag
   │   - the pre-bundled component runtime (see below), inlined as one or
   │     more <script> tags
single .html file
```

The "component runtime" is a separate concern from the markup above: it's the actual browser-side JS that calls every `register*Components()` for its `customElements.define()` side effects, so the tags already present in the markup (`<basemark-card>`, etc.) upgrade into real interactive elements the moment a reader opens the file — no hydration, no client-side markdown re-parsing.

### Pre-bundled at CLI build time, split per domain, inlined per document

That runtime is **pre-bundled at CLI build time**, not per-render — `scripts/bundle-runtime.ts` runs Bun's bundler (`Bun.build()`, `target: 'browser'`) once per entry in `src/runtime/` (`base.ts`, `common.ts`, `bio.ts`), writing each result to its own file under `src/generated/` (gitignored — regenerated, not committed). This runs automatically via this package's `postinstall` script, and again as the first step of its `build` script. `src/render.ts` pulls each one in via a **static** text import (`import ... from './generated/base.runtime.js' with { type: 'text' }`), the same mechanism used for `theme.css`.

This two-step split (build-time script, not a per-render call) exists because of a real `bun build --compile` constraint: a compiled binary runs from an embedded virtual filesystem (`/$bunfs/...`), and `Bun.build()` needs real files on disk to bundle from — calling it *inside* a request handler (the original, simpler design) worked fine under `bun run` but crashed the moment it ran from inside the compiled `dist/basemark` binary (`FileNotFound: failed to open root directory: /$bunfs/root`). A **static** import, by contrast, is visible to Bun's own compiler ahead of time, so it gets embedded into the binary as a string constant — which is why the bundling has to happen *before* compilation.

Splitting into three bundles instead of one, though, is about output size, not `--compile`: `bio.runtime.js` alone is roughly **5MB** minified (it embeds `3Dmol.js`, `protvista-uniprot`, and `locuszoom` — real, heavy vendor libraries), against `common.runtime.js`'s ~30KB and `base.runtime.js`'s ~2KB (just `@basemark/core`'s `basemark-error` component, registered unconditionally — an unknown directive or bad prop can produce one regardless of which domains a document otherwise uses). Every rendered document gets `base.runtime.js`, but `render.ts`'s `usedDomains()` walks the document's own resolved hast tree, cross-references each tag against the registry's domain metadata, and only inlines `common.runtime.js`/`bio.runtime.js` if the document actually resolved a component from that domain. A `card`-only document stays a ~44KB file; a document using `::protvista{...}` picks up the ~5MB `bio` bundle — but only that one, and only because it needs it. Verified directly: a common-only render and a bio-using render, byte-diffed against the expected inclusion/exclusion of `3Dmol`/`LocusZoom`/`protvista-uniprot` strings in each output.

## Known gaps

- No structural/schema linter yet (ARCHITECTURE.md §3's mitigation #3 for unclosed containers) — `render` will happily produce output containing `basemark-error` banners rather than fail the whole build; there's no `--strict`/exit-nonzero-on-error mode yet.
- No batch/static-site rendering (a directory of `.md` files → a directory of `.html` files) — only single-file `render` exists.
- No component scaffolding or registry-validation commands (ARCHITECTURE.md §7's fuller list of what this package is meant to grow into).
- The per-domain bundle split (`common`/`bio`) is coarse — a document using one `bio` component still pays for all 8 (`3Dmol.js` + `protvista-uniprot` + `locuszoom`, bundled together), not just the vendor library it actually needs. Finer, per-component splitting is possible but not built.
- Every output links the `Onest` font from Google Fonts (matching `examples/vanilla`/`examples/react`'s look) — a deliberate exception to "self-contained": that one `<link>` is a real network dependency (falls back to `theme.css`'s system-font stack if the request fails). Embedding the font file directly would restore full offline-safety but add real weight to every single render; not done.
