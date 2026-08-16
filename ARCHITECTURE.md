# Basemark — Architecture & Design Spec

Technical design and rationale for Basemark — the pipeline, syntax, registry, and rendering model. See [README.md](README.md) for a project overview, [AGENTS.md](AGENTS.md) for repo-specific working guidance, and [VISION.md](VISION.md) for who consumes this and how.

## 1. What this is

A Markdown renderer that lets authors embed live, interactive components — protein structure viewers, molecule viewers, genomic tracks, charts, diagrams — using a short identifier (accession ID, PDB ID, locus) instead of raw config or markup.

Primary users: bioinformatics/cheminformatics authors. Secondary: general Markdown authors wanting MDX-like power without a JS framework. Both human and AI authors are expected to write it — the syntax must be cheap and hard to get wrong for an LLM, and legible for a human to hand-write. Meant to be community-extended: others should be able to register components and domain packs without forking core.

---

## 2. Core design principle: the "tiering" model

Never make an author supply a data blob if a short identifier is enough for the component to fetch/derive everything itself.

| Tier | Author writes | Component does | Example |
|---|---|---|---|
| 0 — zero config | nothing but a URL/DOI | auto-detect + fetch | citation card, tweet embed |
| 1 — single ID | one accession/identifier | fetch + parse + render | `::protvista{accession="P05067"}` |
| 2 — composite key | 2-4 short fields | fetch + parse + render | `::locus{chr="7" start="..." end="..."}` |
| 3 — inline literal | the actual (short) content | parse + render, no fetch | ` ```smiles ` fence, small FASTA |
| 4 — full data/URL | structured blob or file URL | render only | escape hatch, avoid as default |

Default every new component to Tier 1/2 — keeps AI-authoring token-cheap/low-error and human-authoring low-effort. Tier 4 is an escape hatch, not the primary UX.

---

## 3. Authoring syntax: remark-directive

Chosen over raw HTML custom elements (ambiguous CommonMark raw-HTML parsing, bad AI failure mode, more tokens per invocation) and markdown-it + a custom container plugin (token-stream parsing, no tree/visitor pattern).

```
:name[label]{attrs}   — text directive: inline, sits inside a sentence
::name{attrs}          — leaf directive: block-level, no children, can't be
                          left open (default for most components)
:::name{attrs}
...markdown children...
:::                    — container directive: block-level, wraps real
                          markdown children (figures, tabs, cards)
```

`{}` = structured attrs (component props). `[]` = optional inline content slot. Default to leaf directives — nothing to leave unclosed.

**Known failure mode:** an unclosed `:::` doesn't error at the remark-directive level — it silently swallows the rest of the document (or its parent block quote/list item) as children, same as an unclosed code fence. Mitigations, in priority order: (1) prefer leaf directives — structural fix; (2) **built** — `parse.ts`'s `resolveDirectives` checks whether a container's raw source actually ends in a closing fence line, flagging it if not; (3) a structural colon-balance linter in CI/pre-commit — not built; (4) **built** — fail visibly: flagged containers resolve to `basemark-error` (`error-element.ts`), which shows the error banner *and* still renders the swallowed content via its own slot, so nothing silently disappears.

---

## 4. Pipeline architecture

```
Markdown text
   │  remark-parse + remark-directive + remark-gfm (via `unified`)
mdast — markdown-shaped tree
   │  custom transform plugin: resolves directive/code nodes against the
   │  Component Registry, validates props against each component's JSON Schema
hast — HTML-shaped tree (e.g. tagName: "structure-viewer")
   │  render step (framework-specific, see §6)
DOM / static HTML / React tree / etc.
```

`unified` is the pipeline runner, not a parser. All directive-to-component logic lives in one custom remark plugin between mdast and hast.

**Data resolution (mimebundles):** for Tier 1/2 components, a data resolver fetches from a URL and hands the component a `{mimetype: representation}` bundle (Jupyter's mimebundle pattern) rather than the renderer guessing raw/base64/json/txt per component. Each manifest declares accepted mimetypes; components own their own parsing (RDKit.js parses SMILES, Mol* parses PDB) — no universal parsing layer.

```yaml
:::structure-viewer
source:
  application/pdb: "https://files.rcsb.org/download/1CRN.pdb"
  image/png: "https://.../1crn_thumbnail.png"   # fallback representation
:::
```

Security: arbitrary client-side URL fetches are an SSRF/tracking risk — route through an allowlist or thin proxy; inline/embedded data is the zero-trust default.

---

## 5. Component registry & manifest contract

Every component ships a manifest: name, prop schema (JSON Schema), accepted mimetypes, version — validated at parse time, so bad AI-generated props produce a clear render-time error, never silent failure or hallucinated prop pass-through.

```js
registry.register({
  name: 'structure',                 // directive name → ::structure{...}
  schema: { pdbId: { type: 'string', required: true } },
  mimetypes: ['chemical/x-pdb'],
  render: { type: 'webcomponent', tag: 'structure-viewer' },
});

// Alternate render path — see §6 for when this is used instead
registry.register({
  name: 'my-chart',
  schema: { data: { type: 'array', required: true } },
  render: { type: 'react', component: MyChartComponent },
});
```

Auto-generate an AI system prompt from the registry (component list + schemas) rather than hand-maintaining prompt docs.

---

## 6. Rendering: Web Components as default, with an escape hatch

**Default path (framework-agnostic):** the transform plugin emits hast nodes that become custom elements (`<protvista-viewer>`, `<structure-viewer>`). Any framework consumes these as plain HTML tags — Svelte via native `<svelte:options customElement="...">`, Solid via `solid-element`, Lit/vanilla natively, React via a wrapper (mounts a React root in `connectedCallback`). Published/shared components (`bio`, `chem`, `common`) must target this tier — cross-framework, raw HTML/SSR.

**Escape hatch:** an app author (not a package author) can register `{ type: 'react', component: X }` and skip the custom-element boundary. Only renders inside that specific framework binding — no cross-framework portability, no SSR fallback unless supplied. For private, app-local components only.

**Nesting & layout:** container directives nest naturally (mdast/hast trees nest); layout composition uses Shadow DOM slots — a `:::card{...}` with a nested `::chart{...}` becomes `<basemark-card>` with a `<slot>` in its shadow root, and the chart projects into it via native slot assignment. Built and validated end-to-end (`@basemark/common`'s `card`/`columns`/`tabs`, §8). `tabs` uses one default slot plus imperative light-DOM reads instead of named slots, since named slots need a static slot count a dynamic tab list doesn't have.

For natively-registered React/Svelte containers, slotting isn't available — the framework binding must reimplement composition by recursively rendering children (e.g. React's `children` prop). Real asymmetry between the two render paths; doesn't apply to the plain-DOM path (`examples/vanilla`), since slotting there is native browser behavior.

---

## 7. Package boundaries

```
        bio, chem, common  ──┐
        react, svelte    ────┼──►  core  ◄──── cli
        (consumer apps)  ────┘
```

Everything depends on core; core depends on nothing framework-specific. No sideways dependencies.

> **Flag:** `@basemark/common`'s `registerCommonComponents()` eagerly registers every component in the package from one call, which a consumer who only wants `card` still pays for in bundle size. That's a minor cost for the layout/shadcn-ui set built so far, but §8's still-unbuilt general-purpose components (Mermaid, Vega-Lite/Plotly, MapLibre/Leaflet) are each genuinely heavy dependencies — bundling any of those into `@basemark/common` itself would make the whole package expensive for every consumer, not just the one using that component. Before building them, split each heavy one out into its own package (e.g. `@basemark/diagrams`, `@basemark/charts`, `@basemark/maps`) rather than adding it to `common` — not a subpath export, a real separate package with its own `register*Components(registry)`, same shape as `bio`/`chem`. Undecided which components clear the "heavy enough to need its own package" bar; KaTeX/citations/JSON-tree-viewers are probably light enough to stay in `common`.

- **`@basemark/core`** — parse (mdast), transform (mdast→hast + registry resolution), data resolver, registry API. Pure logic, no DOM, runs in Node or browser. Must stay small and stable since everything depends on it.
- **`@basemark/react` / `@basemark/svelte`** — take core's hast tree and mount it per-framework. Only layer where native registration and children-based composition make sense.
- **`@basemark/cli`** — build-time tooling: static-site batch rendering, structural/schema linter, component scaffolding, registry validation, and rendering a single doc to one self-contained shareable HTML file (see VISION.md).

---

## 8. Component catalog (tiered, by domain)

**Bio/chem — Tier 1:** `::protvista{accession="..."}` (UniProt/Nightingale), `::structure{pdbId="..."}` (Mol*/NGL/3Dmol), `::molecule{cid="..."}` (PubChem→RDKit.js), `::variant{rsid="..."}`, `::pathway{keggId="..."}`, `::gene{ensembl="..."}`, `::citation{doi="..."}`

**Bio/chem — Tier 2:** `::locus{chr="7" start="..." end="..."}` (LocusZoom-style), `::genome-browser{locus="chr7:..."}` (IGV.js/JBrowse), `::interaction-network{gene="TP53"}`

**Bio/chem — Tier 3:** ` ```smiles ` (RDKit.js/SmilesDrawer), ` ```fasta `, ` ```newick ` (phylogenetic tree)

**General-purpose (`@basemark/common`):** Mermaid family, Vega-Lite/Plotly charts, KaTeX, sortable tables, maps (MapLibre/Leaflet), citations (BibTeX), JSON/tree viewers, media embeds.

**Layout/container (`@basemark/common`):** `:::card{title="..."}`, `:::columns{cols="..."}` (CSS Grid), `:::tabs`/`:::tab-panel{label="..."}` — see §6 for the slotting model and `packages/common/README.md` for build status. All three zero the vertical margin a nested bio/chem component would otherwise contribute, via `::slotted()` overrides.

**Mermaid design note:** one shared `<mermaid-diagram>` component renders raw Mermaid source (Mermaid dispatches by diagram type itself). Guided directives (`::gantt{...}`, `::flowchart{...}`, `::fishbone{...}`) are thin translators — structured attrs → generated Mermaid source → same shared renderer. Raw ` ```mermaid ` fence remains the Tier-4 escape hatch for unguided diagram types.

Build status per component (what's real vs. planned) lives in `packages/bio/README.md` and `packages/common/README.md`, not here.

---

## 9. Monorepo structure & tooling

Tooling: Bun workspaces + Turborepo + Changesets. (Not pnpm — `packages/cli` ships as a compiled standalone executable via `bun build --compile`, so the CLI's runtime and the repo's package manager/workspace resolver are the same Bun install; running two JS toolchains side by side wasn't worth it. `bun build --compile`'s output runs from an embedded virtual filesystem, so its component-runtime JS can't be bundled per-render the way `bun run` can (`Bun.build()` needs real files on disk) — `packages/cli/scripts/bundle-runtime.ts` pre-bundles it once at package build time instead, and `src/render.ts` pulls the result in via a static text import (same mechanism as `@basemark/core/theme.css`) so Bun's compiler can embed it. Not Lerna — Turbo supersedes its task-running role, and Changesets fits a PR-driven OSS release flow better.)

```
basemark/
├── packages/     # published, versioned (core, common, bio, chem, react, svelte, cli)
├── apps/         # deployed, not published (docs site)
├── examples/     # per-framework integration demos + CI surface for wrapper breakage
├── experiments/  # POCs, no stability contract, excluded from workspace/turbo globs
├── configs/      # shared eslint/tsconfig/vitest configs, workspace-internal
├── turbo.json
├── package.json  # "workspaces" field defines the workspace globs (bun, no separate yaml)
└── .changeset/
```

`examples/` and `apps/` packages are `private: true` and unscoped, so it's visually obvious in tooling output which packages are real published artifacts. `experiments/` doesn't exist yet (see AGENTS.md) — target structure once there's something real to put there.

---

## 10. Open / undecided

- Final project name ("Basemark" kept domain-neutral so it prefixes cleanly across `core`, `bio`, `chem`, and future packs like `geo`).
- Full manifest JSON Schema spec (§5 is conceptual, not finalized field-by-field).
- SSR fallback contract for natively-registered (non-web-component) framework components.
- Full list of guided Mermaid wrapper directives to ship at v1 vs. leave to the raw-fence escape hatch.
- Whether Mermaid/Vega-Lite-Plotly/MapLibre-Leaflet ship as their own packages instead of joining `@basemark/common`, and exactly where the size threshold sits for that call — see §7's flag.
- §6's native framework registration escape hatch has no implementation path yet: `registry.ts`'s `ComponentDefinition` has no `render` field to distinguish it from the default custom-element tag, `parse.ts`'s `resolveDirectives` unconditionally emits `hName: definition.tag`, and `packages/react`'s renderer only ever resolves via `customElements.get(tagName)`. All three would need to change together.
- The unclosed-container detection (§3) is a heuristic (checks for a fence-only closing line), not a from-first-principles parse of remark-directive's closing rules — nested indentation inside a list item/block quote isn't specifically exercised. The structural linter (§3 mitigation #3) is still unbuilt.
- Who consumes this and how is a separate, product-facing concern — see [VISION.md](VISION.md).
