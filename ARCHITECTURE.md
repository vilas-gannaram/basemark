# Basemark — Architecture & Design Spec

See [README.md](README.md) for a project overview, [AGENTS.md](AGENTS.md) for repo working guidance, [VISION.md](VISION.md) for who consumes this.

## 1. What this is

A Markdown renderer that embeds live, interactive components — protein viewers, molecule viewers, genomic tracks, charts — using a short identifier (accession ID, PDB ID, locus) instead of raw config.

Primary users: bioinformatics/cheminformatics authors. Secondary: general Markdown authors wanting MDX-like power with no JS framework. Both human and AI write it, so the syntax must be cheap and hard to get wrong. Community-extendable without forking core.

---

## 2. Tiering model

Never make an author supply a data blob if a short identifier is enough for the component to fetch/derive the rest itself.

| Tier | Author writes | Component does | Example |
|---|---|---|---|
| 0 — zero config | nothing but a URL/DOI | auto-detect + fetch | citation card |
| 1 — single ID | one accession/identifier | fetch + parse + render | `::protvista{accession="P05067"}` |
| 2 — composite key | 2-4 short fields | fetch + parse + render | `::locus{chr="7" start="..." end="..."}` |
| 3 — inline literal | the actual short content | parse + render, no fetch | ` ```smiles ` fence |
| 4 — full data/URL | structured blob or file URL | render only | escape hatch, avoid |

Default new components to Tier 1/2. Tier 4 is an escape hatch, not the default UX.

---

## 3. Authoring syntax: remark-directive

Chosen over raw HTML custom elements (ambiguous parsing, bad AI failure mode) and markdown-it (no tree/visitor pattern).

```
:name[label]{attrs}   — text directive: inline, sits in a sentence
::name{attrs}          — leaf directive: block-level, no children (default)
:::name{attrs}
...markdown children...
:::                    — container directive: wraps real markdown children
```

Default to leaf directives — nothing to leave unclosed.

**Known failure mode:** an unclosed `:::` silently swallows the rest of the document as children. Mitigations:
1. Prefer leaf directives (structural fix).
2. **Built** — `parse.ts` checks whether a container's raw source ends in a closing fence line, flags it if not.
3. Structural colon-balance linter in CI — not built.
4. **Built** — fail visibly: flagged containers render as `basemark-error`, which still shows the swallowed content via its own slot.

---

## 4. Pipeline

```
Markdown text
   │  remark-parse + remark-directive + remark-gfm (via `unified`)
mdast
   │  custom plugin: resolves directives against the Component Registry,
   │  validates props against each component's JSON Schema
hast (e.g. tagName: "structure-viewer")
   │  render step, framework-specific (§6)
DOM / static HTML / React tree
```

**Data resolution (mimebundles):** for Tier 1/2 components, a resolver fetches a URL and hands the component a `{mimetype: representation}` bundle (Jupyter's pattern) instead of the renderer guessing the format. Components own their own parsing — no universal parsing layer.

```yaml
:::structure-viewer
source:
  application/pdb: "https://files.rcsb.org/download/1CRN.pdb"
:::
```

Security: client-side URL fetches are an SSRF risk — route through an allowlist/proxy; embedded data is the zero-trust default.

---

## 5. Component registry & manifest

Every component ships a manifest — name, prop schema, mimetypes, version — validated at parse time, so bad props fail visibly instead of passing through.

```js
registry.register({
  name: 'structure',
  schema: { pdbId: { type: 'string', required: true } },
  mimetypes: ['chemical/x-pdb'],
  render: { type: 'webcomponent', tag: 'structure-viewer' },
});

// Escape hatch — see §6
registry.register({
  name: 'my-chart',
  schema: { data: { type: 'array', required: true } },
  render: { type: 'react', component: MyChartComponent },
});
```

The AI-facing system prompt is auto-generated from the registry, not hand-maintained.

---

## 6. Rendering: Web Components default, escape hatch for app-local

**Default:** directives resolve to custom elements (`<structure-viewer>`). Any framework consumes them as plain tags — React via a wrapper, Svelte/Solid/Lit natively. Published packages (`bio`/`chem`/`common`) must target this.

**Escape hatch:** `{ type: 'react', component: X }` skips the custom-element boundary — only renders in that one framework, no portability. App-local components only, never package components.

**Nesting/layout:** container directives nest via mdast/hast; composition uses Shadow DOM slots (`:::card{}` with a nested `::chart{}` → `<slot>` projection). `tabs` uses one default slot + imperative light-DOM reads instead of named slots (a dynamic tab count can't use named slots).

Natively-registered React/Svelte components can't use slotting — the framework binding reimplements composition via `children`. Doesn't apply to plain-DOM (`examples/vanilla`) — slotting there is native.

---

## 7. Package boundaries

```
        bio, chem, common  ──┐
        react, svelte    ────┼──►  core  ◄──── cli
        (consumer apps)  ────┘
```

Everything depends on core; core depends on nothing framework-specific.

> **Flag:** `registerCommonComponents()` eagerly registers everything in `common`, so a `card`-only consumer still pays for it. Fine for the current shadcn-ui set, but §8's unbuilt heavy components (Mermaid, Vega-Lite/Plotly, MapLibre/Leaflet) should each be their own package (`@basemark/diagrams` etc.), not added to `common`. KaTeX/citations/JSON-viewers are probably light enough to stay.

- **`@basemark/core`** — parse, transform, registry, data resolver. Pure logic, no DOM. Must stay small and stable.
- **`@basemark/react` / `@basemark/svelte`** — mount core's hast tree per-framework.
- **`@basemark/cli`** — build-time tooling: batch rendering, linter, scaffolding, registry validation, single-file shareable HTML (see VISION.md).

---

## 8. Component catalog

**Bio/chem — Tier 1:** `::protvista{accession}` (UniProt), `::structure{pdbId}` (Mol*/3Dmol), `::molecule{cid}` (RDKit.js), `::variant{rsid}`, `::pathway{keggId}`, `::gene{ensembl}`, `::citation{doi}`

**Bio/chem — Tier 2:** `::locus{chr start end}` (LocusZoom), `::genome-browser{locus}` (IGV.js), `::interaction-network{gene}`

**Bio/chem — Tier 3:** ` ```smiles ` (RDKit.js), ` ```fasta `, ` ```newick `

**General-purpose (`common`):** Mermaid family, Vega-Lite/Plotly, KaTeX, sortable tables, maps, citations, JSON/tree viewers, media embeds.

**Layout (`common`):** `:::card`, `:::columns`, `:::tabs`/`:::tab-panel` — see §6 and `packages/common/README.md`. All three zero the margin a nested component would otherwise add.

**Mermaid note:** one shared `<mermaid-diagram>` renders raw Mermaid source. Guided directives (`::gantt`, `::flowchart`, etc.) translate attrs → generated Mermaid source → same renderer. Raw ` ```mermaid ` fence is the Tier-4 escape hatch.

Build status (real vs. planned) lives in `packages/bio/README.md` / `packages/common/README.md`, not here.

---

## 9. Monorepo structure & tooling

Bun workspaces + Turborepo + Changesets.
- Not pnpm — `packages/cli` ships as a `bun build --compile` binary, so the CLI's runtime and the repo's package manager are the same Bun install.
- Not Lerna — Turbo covers task-running, Changesets fits a PR-driven release flow.

```
basemark/
├── packages/     # published, versioned (core, common, bio, chem, react, svelte, cli)
├── apps/         # deployed, not published (docs site)
├── examples/     # per-framework integration demos
├── experiments/  # POCs, no stability contract (doesn't exist yet)
├── configs/      # shared eslint/tsconfig/vitest configs
├── turbo.json
├── package.json  # "workspaces" field defines the globs
└── .changeset/
```

`examples/`/`apps/` are `private: true` and unscoped — visibly not published artifacts.

---

## 10. Open / undecided

- Final project name.
- Full manifest JSON Schema spec (§5 is conceptual, not field-by-field).
- SSR fallback for natively-registered (non-web-component) framework components.
- Which guided Mermaid directives ship at v1 vs. stay raw-fence-only.
- Which `common` candidates need their own package — see §7's flag.
- §6's escape hatch has no implementation path yet: `registry.ts` has no `render` field, `parse.ts` always emits `hName: definition.tag`, `@basemark/react` only resolves via `customElements.get`. All three need to change together.
- Unclosed-container detection (§3) is a heuristic, not a full parse of remark-directive's closing rules. The structural linter is still unbuilt.
- Who consumes this and how — see [VISION.md](VISION.md).
