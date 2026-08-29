# @basemark/cli

Build-time tooling for Basemark. First command: `render` — resolves a markdown(+directives) file into one self-contained HTML file. Open it in any browser: no server, no build step, no framework runtime.

## Usage

```sh
npx @basemark/cli render doc.md -o doc.html

# or install it once:
npm install -g @basemark/cli
basemark render doc.md -o doc.html
```

Runs on plain Node. `dist/index.js` is a self-contained bundle (every dependency, including `@basemark/bio`/`common`/`charts`, is built in); your markdown input is **not** embedded, it's read from disk each run.

## What gets resolved

`render` builds a registry from `@basemark/core` + `@basemark/common` + `@basemark/bio` + `@basemark/charts`.

- **`common`'s 14 components** are fully wired — each custom-element class is declared *inside* its `register*` function behind a `typeof HTMLElement` guard, so importing the package under Node (no browser) is safe.
- **`bio`'s 14 components** go one step further — their vendor libraries (`3dmol`, `protvista-uniprot`, `locuszoom`) crash on load outside a browser regardless of any guard, so they're dynamically `import()`ed instead, making every `register*` function `async`.
- **`charts`' 7 components** (ECharts) follow the same guard as `common` — `echarts` imports cleanly under Node with no DOM, so no dynamic `import()` is needed.
- **`chem`** is an empty stub.

Any resolution failure (unknown directive, bad prop, unclosed `:::`) renders a visible `basemark-error` banner — never a silent drop.

## How a render happens

```
markdown → parseMarkdown() (no DOM) → hast tree
         → hast-util-to-html → body markup
         → wrapped with theme.css + the component runtime → one .html file
```

The "component runtime" is separate: browser-side JS that calls every `register*Components()` so the already-resolved tags (`<basemark-card>`, etc.) upgrade into real elements the moment the file opens — no hydration, no re-parsing.

### Runtime bundling: pre-built, split per domain, inlined per document

The runtime is bundled **at CLI build time**, not per-render — `scripts/bundle-runtime.ts` runs `tsup` once for every entry in `src/runtime/` (`base`, `common`, `bio`, `charts`), writing each to `src/generated/`. `tsup.config.ts`'s `onSuccess` hook copies those (plus `theme.css`) into `dist/generated/`, and `render.ts` reads each one at runtime via a plain `fs.readFileSync` relative to its own module location.

Why build-time, not per-render: a per-render bundler call needs a real filesystem to bundle from — doesn't survive being bundled itself.

Why four bundles, not one: `bio.global.js` is ~5MB (3Dmol.js/protvista-uniprot/locuszoom); `charts.global.js` (ECharts) is ~1.2MB; `common.global.js` is ~30KB; `base.global.js` (just the error component, always inlined) is ~2KB. `render.ts`'s `usedDomains()` checks which domains a document's resolved tags actually belong to, and only inlines the bundles it needs — a `card`-only doc stays small, a `::protvista{}` doc picks up the 5MB `bio` bundle but nothing else.

## Known gaps

- No structural linter — an unclosed `:::` produces a `basemark-error` banner, not a build failure. No `--strict` mode.
- No batch rendering — one file at a time, no directory-in/directory-out mode.
- No scaffolding or registry-validation commands.
- The `bio` bundle is one file for all 14 components — using just `structure` still pulls in `locuszoom`/`protvista-uniprot`'s weight. Per-component splitting isn't built.
- Every output links the `Onest` Google Font (matching the example apps) — the one deliberate network dependency in an otherwise self-contained file. Falls back to the system font stack if the request fails.
