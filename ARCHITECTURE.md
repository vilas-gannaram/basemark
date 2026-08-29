# Basemark — Architecture & Design Spec

See [README.md](README.md) for a project overview, including who consumes this, and [AGENTS.md](AGENTS.md) for repo working guidance.

## 1. Design constraints

Primary users: bioinformatics/cheminformatics authors. Secondary: general Markdown authors wanting MDX-like power with no JS framework. Both human and AI write it, so the syntax must be cheap and hard to get wrong. Community-extendable without forking core.

---

## 2. Tiering model

Never make an author supply a data blob if a short identifier is enough for the component to fetch/derive the rest itself.

| Tier | Author writes | Component does | Example |
|---|---|---|---|
| 0 — zero config | nothing but a URL/DOI | auto-detect + fetch | citation card |
| 1 — single ID | one accession/identifier | fetch + parse + render | `::protvista{accession="P05067"}` |
| 2 — composite key | 2-4 short fields | fetch + parse + render | `::locus{chr="7" start="..." end="..."}` |
| 3 — inline literal | the actual short content | parse + render, no fetch | `::fasta{sequence="..."}` |
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

**Known failure mode:** a bare `word:word` in prose (a genomic coordinate like `chr10:114550452`, a variant ID like `10:114758349_C/T`, a timestamp) parses as a **text directive** (`:name` — see §3's syntax block) — the text after the colon silently becomes an "unknown component" `basemark-error` instead of plain text. No structural fix (the syntax is inherently ambiguous with prose); wrap the literal in backticks (an inline code span isn't tokenized as a directive) whenever colon-separated content like this appears outside of a directive's own attributes.

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

---

## 5. Component registry & manifest

Every component ships a manifest — name, prop schema, version — validated at parse time, so bad props fail visibly instead of passing through.

```js
registry.register({
  name: 'structure',
  schema: { pdbId: { type: 'string', required: true } },
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

**Default:** directives resolve to custom elements (`<structure-viewer>`). Any framework consumes them as plain tags — React via a wrapper, Svelte/Solid/Lit natively. Published packages (`bio`/`chem`/`common`/`charts`) must target this.

**Escape hatch:** `{ type: 'react', component: X }` skips the custom-element boundary — only renders in that one framework, no portability. App-local components only, never package components.

**Nesting/layout:** container directives nest via mdast/hast; composition uses Shadow DOM slots (`:::card{}` with a nested `::chart{}` → `<slot>` projection). `tabs` uses one default slot + imperative light-DOM reads instead of named slots (a dynamic tab count can't use named slots).

Natively-registered React/Svelte components can't use slotting — the framework binding reimplements composition via `children`. Doesn't apply to plain-DOM (`examples/vanilla`) — slotting there is native.

---

## 7. Package boundaries

```
        bio, chem, common, charts  ──┐
        react, svelte            ────┼──►  core  ◄──── cli
        (consumer apps)          ────┘
```

Everything depends on core; core depends on nothing framework-specific.

> **Flag:** `registerCommonComponents()` eagerly registers everything in `common`, so a `card`-only consumer still pays for it. Fine for the current shadcn-ui set, but unbuilt heavy components (Mermaid, MapLibre/Leaflet) should each be their own package (`@basemark/diagrams` etc.), not added to `common` — `@basemark/charts` (ECharts) is the first proof of this pattern, split out on exactly this reasoning; see its README for a parked note on how Mermaid would fit it. KaTeX/citations/JSON-viewers are probably light enough to stay in `common`.

- **`@basemark/core`** — parse, transform, registry, data resolver. Pure logic, no DOM. Must stay small and stable.
- **`@basemark/react` / `@basemark/svelte`** — mount core's hast tree per-framework.
- **`@basemark/cli`** — build-time tooling: batch rendering, linter, scaffolding, registry validation, single-file shareable HTML (see README.md's "Who uses this").

---

## 8. Monorepo structure & tooling

pnpm workspaces + Turborepo + Changesets.
- pnpm, not Bun — `changesets/cli`'s publish command only rewrites `workspace:*` ranges natively for pnpm/yarn; npm and Bun both fall through to a plain `npm publish` with zero rewriting, shipping the literal `workspace:*` string and breaking `npm install` for consumers. `tsup` (esbuild) is each package's build tool (`tsup.config.ts` in each), independent of the package manager. Published output doesn't require pnpm or Bun: library packages ship plain JS, and `packages/cli` bundles to a plain Node-runnable `dist/index.js`.
- Not Lerna — Turbo covers task-running, Changesets fits a PR-driven release flow.

```
basemark/
├── packages/     # published, versioned (core, common, bio, chem, react, svelte, cli)
├── apps/         # deployed, not published (docs site)
├── examples/     # per-framework integration demos
├── experiments/  # POCs, no stability contract (doesn't exist yet)
├── configs/      # shared vitest config
├── .changeset/
├── turbo.json
└── pnpm-workspace.yaml  # defines the workspace package globs
```

`pnpm changeset` to add one, `pnpm run version` to bump, `pnpm run release` to publish.

`examples/`/`apps/` are `private: true` and unscoped — visibly not published artifacts.

---

## 9. Open / undecided

- Full manifest JSON Schema spec (§5 is conceptual, not field-by-field).
- SSR fallback for natively-registered (non-web-component) framework components.
- Which guided Mermaid directives ship at v1 vs. stay raw-fence-only.
- Which `common` candidates need their own package — see §7's flag.
- Unclosed-container detection (§3) is a heuristic, not a full parse of remark-directive's closing rules. The structural linter is still unbuilt.
- No convention for which `common` layout/container component to wrap a top-level component in when authoring a doc — `card`, `columns`, `tabs`/`tab-panel`, `accordion`/`accordion-item`, `carousel`, `popover` (`packages/common/README.md`) all overlap in what they can hold, and nothing says which fits which situation.
- Who consumes this and how — see README.md.
