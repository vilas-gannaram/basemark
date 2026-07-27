# Basemark — Architecture & Design Spec

Technical design rationale and decisions for Basemark — the pipeline, syntax, registry, and rendering model. See [README.md](README.md) for a project overview and current status, [CLAUDE.md](CLAUDE.md) for repo-specific working guidance, and [VISION.md](VISION.md) for who consumes this and how (a product concern, kept separate from the technical design here).

## 1. What this is

A Markdown renderer that lets authors embed live, interactive components — protein structure viewers, molecule viewers, genomic tracks, charts, diagrams — using a short identifier (accession ID, PDB ID, locus) instead of raw config or markup.

Primary users: bioinformatics/cheminformatics authors (researchers, data scientists writing docs/reports/wikis). Secondary: general Markdown authors wanting MDX-like power without a JS framework.

Both human and AI authors are expected to write this Markdown — the syntax must be cheap and hard to get wrong for an LLM to generate, and legible for a human to hand-write. It's meant to be community-extended: others should be able to register their own components and domain packs without forking core.

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

Default every new component to Tier 1/2. Tier 4 is an escape hatch, not the primary UX — this keeps AI-authoring token-cheap/low-error and human-authoring low-effort.

---

## 3. Authoring syntax: remark-directive

Chosen over raw HTML custom elements (ambiguous CommonMark raw-HTML parsing rules, bad AI failure mode, more tokens per invocation) and markdown-it + a custom container plugin (token-stream parsing, no tree/visitor pattern).

### Three directive forms

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

### Known failure mode: unclosed container directives

An unclosed `:::` doesn't error at the remark-directive level — it silently swallows the rest of the document (or the rest of its parent block quote/list item) as children, same as an unclosed code fence. Mitigations, in priority order:

1. Prefer leaf directives (structural fix).
2. **Built**: `parse.ts`'s `resolveDirectives` checks whether a container directive's raw source actually ends in a closing fence line (`:::`, or more colons for a nested container); if not, it's flagged rather than silently accepted.
3. A structural linter (colon-balance check) in CI/pre-commit, especially for layout directives — not built.
4. **Built**: fail visibly — flagged containers resolve to the `basemark-error` component (`error-element.ts`), which shows the error banner *and* still renders whatever content got swallowed (via its own slot), so nothing silently disappears along with the warning.

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

### Data resolution model (mimebundles)

For Tier 1/2 components, a data resolver fetches from a URL and hands the component a `{mimetype: representation}` bundle (Jupyter's mimebundle pattern), rather than the renderer guessing raw/base64/json/txt per component. Each manifest declares accepted mimetypes; components own their own parsing (RDKit.js parses SMILES, Mol* parses PDB) — no universal parsing layer.

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

**Default path (framework-agnostic):** the transform plugin emits hast nodes that become custom elements (`<protvista-viewer>`, `<structure-viewer>`). Any framework consumes these as plain HTML tags:

- **Svelte**: native `<svelte:options customElement="...">`, no wrapper.
- **Solid**: `solid-element`.
- **React**: needs a wrapper (e.g. `react-to-webcomponent`) — mounts a React root in `connectedCallback`.
- **Lit / vanilla**: thin native layer.

Published/shared components (`bio`, `chem`, `common`) must target this tier — cross-framework, raw HTML/SSR.

**Escape hatch:** an app author (not a package author) can register `{ type: 'react', component: X }` and skip the custom-element boundary — the framework binding intercepts before rendering, falling through to `customElements.get()` otherwise. Tradeoff: only renders inside that specific framework binding, no cross-framework portability, no SSR fallback unless one is supplied. For private, app-local components only.

### Nesting & layout

Container directives nest naturally (mdast/hast trees nest). Layout composition uses Shadow DOM slots:

```
:::card{title="Expression levels"}
::chart{type="bar" data-url="/expr.json"}
:::
```

→ `<basemark-card>` has a `<slot>` in its shadow root; the nested `<chart-viewer>` projects into it via native slot assignment. This is now built and validated end-to-end (`@basemark/common`'s `card`/`columns`/`tabs` — see §8 and `packages/common/README.md`); `tabs` deviates from the "named slots" idea sketched above in favor of one default slot plus imperative light-DOM reads, since named slots need a static slot count that a dynamic tab list doesn't have.

For natively-registered React/Svelte containers, slotting isn't available — the framework binding must reimplement composition by recursively rendering children and passing them as e.g. React's `children` prop. Real asymmetry between the two render paths. (This asymmetry doesn't apply to the plain-DOM path — `examples/vanilla` mounts the same nested custom elements with no framework and no reimplemented composition at all, since slotting is native browser behavior, not something a renderer has to provide.)

---

## 7. Package boundaries

```
        bio, chem, common  ──┐
        react, svelte    ────┼──►  core  ◄──── cli
        (consumer apps)  ────┘
```

Everything depends on core; core depends on nothing framework-specific. No sideways dependencies (react never imports svelte; cli doesn't require react unless a specific opt-in subcommand needs it).

- **`@basemark/core`** — parse (mdast), transform (mdast→hast + registry resolution), data resolver, registry API. Pure logic, no DOM, runs in Node or browser. Output is a plain hast tree, not rendered anything. Must stay small and stable since everything depends on it.
- **`@basemark/react` / `@basemark/svelte`** — take core's hast tree and mount it per-framework. Only layer where native (non-web-component) registration and children-based composition make sense.
- **`@basemark/cli`** — build-time tooling: static-site batch rendering, structural/schema linter (CI, not in-browser), component scaffolding, registry validation, and rendering a single markdown+directives doc to one self-contained shareable HTML file (see VISION.md). Depends on core; optionally a wrapper for specific SSG subcommands.

---

## 8. Component catalog (tiered, by domain)

**Bio/chem — Tier 1:** `::protvista{accession="..."}` (UniProt/Nightingale), `::structure{pdbId="..."}` (Mol*/NGL/3Dmol), `::molecule{cid="..."}` (PubChem→RDKit.js), `::variant{rsid="..."}`, `::pathway{keggId="..."}`, `::gene{ensembl="..."}`, `::citation{doi="..."}`

**Bio/chem — Tier 2:** `::locus{chr="7" start="..." end="..."}` (LocusZoom-style), `::genome-browser{locus="chr7:..."}` (IGV.js/JBrowse), `::interaction-network{gene="TP53"}`

**Bio/chem — Tier 3:** ` ```smiles ` (RDKit.js/SmilesDrawer), ` ```fasta `, ` ```newick ` (phylogenetic tree)

**General-purpose (`@basemark/common`):** Mermaid family (flowchart, gantt, timeline, fishbone — native Mermaid diagram types as of v11.13), Vega-Lite/Plotly charts, KaTeX, sortable tables, maps (MapLibre/Leaflet), citations (BibTeX), JSON/tree viewers, media embeds.

**Layout/container (`@basemark/common`) — built:** `:::card{title="..."}` (single slot — built first, as the minimal case to prove directive-nesting → hast-nesting → `<slot>` projection end-to-end), `:::columns{cols="..."}` (layout-only CSS Grid, one child per cell), `:::tabs` / `:::tab-panel{label="..."}` (one default slot plus imperative light-DOM reads instead of named slots — see §6 and `packages/common/README.md` for why). All three zero the vertical margin a nested bio/chem component would otherwise contribute, via `::slotted()` overrides.

**Mermaid design note:** one shared `<mermaid-diagram>` component renders raw Mermaid source (Mermaid dispatches by diagram type itself). Guided directives (`::gantt{...}`, `::flowchart{...}`, `::fishbone{...}`) are thin translators — structured attrs → generated Mermaid source → same shared renderer. Raw ` ```mermaid ` fence remains the Tier-4 escape hatch for diagram types without a guided wrapper, or unusual custom syntax.

---

## 9. Monorepo structure & tooling

Tooling: pnpm workspaces + Turborepo + Changesets. (Not Bun — install-speed gains don't outweigh OSS contributor friction at this scale; not Lerna — Turbo supersedes its task-running role, and Changesets fits a PR-driven OSS release flow better.)

```
basemark/
├── packages/     # published, versioned (core, common, bio, chem, react, svelte, cli)
├── apps/         # deployed, not published (docs site)
├── examples/     # per-framework integration demos + CI surface for wrapper breakage
├── experiments/  # POCs, no stability contract, excluded from workspace/turbo globs
├── configs/      # shared eslint/tsconfig/vitest configs, workspace-internal
├── turbo.json
├── pnpm-workspace.yaml
└── .changeset/
```

`examples/` and `apps/` packages are `private: true` and unscoped, so it's visually obvious in tooling output which packages are real published artifacts.

`examples/` now has two real members — `examples/vanilla` (direct `@basemark/core` usage with no framework binding) and `examples/react` (`@basemark/react` usage in the browser). `experiments/` still doesn't exist (see CLAUDE.md) — still the target structure once there's something real to put there.

---

## 10. Open / undecided

- Final project name ("Basemark" kept domain-neutral so it prefixes cleanly across `core`, `bio`, `chem`, and future packs like `geo`).
- Full manifest JSON Schema spec (§5 is conceptual, not finalized field-by-field).
- SSR fallback contract for natively-registered (non-web-component) framework components — no defined behavior for server-rendering a doc with no framework runtime present.
- Full list of guided Mermaid wrapper directives to ship at v1 vs. leave to the raw-fence escape hatch.
- §6's native framework registration escape hatch (`{ type: 'react', component: X }`, app-local only — never for pack authors) has no implementation path yet: `registry.ts`'s `ComponentDefinition` has no `render` field to distinguish it from the default custom-element tag, `parse.ts`'s `resolveDirectives` unconditionally emits `hName: definition.tag`, and `packages/react`'s renderer only ever resolves via `customElements.get(tagName)`. All three would need to change together for this to exist.
- The unclosed-container detection (§3) is a heuristic — it checks whether a container's raw source ends in a fence-only line, which is reliable for the common case but isn't a from-first-principles parse of remark-directive's own closing rules (nested indentation inside a list item/block quote isn't specifically exercised). A structural linter (§3 mitigation #3) is still unbuilt.
- Who consumes this and how (direct library use, Claude Skills authoring, CLI-rendered shareable HTML) is a separate, product-facing concern — see [VISION.md](VISION.md), including that initiative's own open questions (bundling strategy, data self-containment, offline fallback).
