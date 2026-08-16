# Basemark: architecture at a glance

This page is itself normal markdown, rendered here by `MarkdownRenderer` from `@basemark/react`. Everything below is the high-level shape of how that happens; see `ARCHITECTURE.md` at the repo root for the full spec this summarizes.

:::alert{title="What Basemark is"}
A Markdown renderer that lets authors embed live, interactive components — protein viewers, genomic tracks, charts — using a short identifier instead of raw config, via a `remark-directive` syntax layered on top of ordinary Markdown.
:::

## Pipeline

One `unified` pipeline turns directive-annotated markdown into real DOM, in four stages:

```
Markdown text
   │  remark-parse + remark-directive + remark-gfm
mdast — markdown-shaped tree
   │  resolveDirectives: matches each directive against the Component
   │  Registry, validates its props against that component's JSON Schema
hast — HTML-shaped tree (e.g. tagName: "locuszoom-assoc")
   │  render step — React here, plain DOM elsewhere (see below)
DOM / React tree / static HTML
```

`unified` just runs the pipeline; all directive-resolution logic lives in one plugin (`resolveDirectives` in `packages/core/src/parse.ts`) between the mdast and hast stages — the exact same code path this React app and `examples/vanilla` both call into.

## Authoring syntax: remark-directive

Three directive forms, all valid in the page you're reading right now:

```md
:name[label]{attrs}    text directive — inline, sits inside a sentence
::name{attrs}          leaf directive — block-level, no children
:::name{attrs}
...markdown children...
:::                    container directive — wraps real markdown children
```

New components default to **leaf directives** — nothing to leave unclosed. Containers are for real child content only, like the `:::alert{}` box above or the `:::card{}` wrapping the plot below.

## The tiering model

The core design rule: never make an author supply a data blob when a short identifier is enough for the component to fetch or derive everything itself.

| Tier | Author writes | Example |
| --- | --- | --- |
| 0 | nothing but a URL | citation card, tweet embed |
| 1 | one accession/identifier | `::protvista{accession="P05067"}` |
| 2 | 2–4 short composite fields | `::locuszoom-assoc{chrom="10" start="..." end="..."}` |
| 3 | inline literal (short) | a ` ```smiles ` fence |
| 4 | full data blob or URL | escape hatch, avoided by default |

New components target Tier 1/2 — cheap for an AI to author correctly, low-effort for a human to hand-write.

:::card{title="Tier 2 in this repo, live"}
This uses `::locuszoom-assoc{chrom="10" start="..." end="..."}` — three short fields, and the component fetches/renders the rest itself.

::locuszoom-assoc{chrom="10" start="114550452" end="115067678"}
:::

## Registry & rendering: Web Components by default, React via a generic wrapper

Every component registers a manifest — name, prop schema, and a render target:

```ts
import { createRegistry } from '@basemark/core';

const registry = createRegistry();
registry.register('structure', {
  tag: 'structure-viewer',
  domain: 'bio',
  title: 'Structure Viewer',
  schema: { pdbId: { type: 'string', required: true } },
});
```

The default render target is a **Web Component** (`hName: definition.tag` in the hast output) — framework-agnostic by design. `MarkdownRenderer` walks the resolved hast tree and, for every custom element tag, looks it up via `customElements.get(tagName)` and wraps it generically with `@lit/react`'s `createComponent()` — so it mounts as a real React component. That wrapper is written once, for any tag; there's no per-component React code anywhere in `@basemark/bio` or `@basemark/common`.

The one exception on this page is :gene-chip[TCF7L2]{full="Transcription factor 7-like 2" chrom="10"} — a real React component (its own `useState`), registered with `{ type: 'react', component: GeneChip }` instead of a tag. That's ARCHITECTURE.md §6/§10's native-registration escape hatch: app-local only, never for a published pack, and it only works because `MarkdownRenderer` specifically knows how to resolve it. `renderMarkdown()` in `examples/vanilla` has no such branch — the same directive there would fail to resolve.

## Package boundaries

```
        bio, chem, common  ──┐
        react, svelte    ────┼──►  core  ◄──── cli
        (consumer apps)  ────┘
```

Everything depends on `@basemark/core`; core depends on nothing framework-specific. This example is the one place in the repo importing `@basemark/react` — every other package (`bio`, `common`, `examples/vanilla`) stays framework-agnostic.
