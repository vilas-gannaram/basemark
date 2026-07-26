# Basemark — Vision & Consumption Paths

See [README.md](README.md) for what Basemark is and current implementation status, and [ARCHITECTURE.md](ARCHITECTURE.md) for the technical design spec. This file is about who uses the pipeline and how — a product/consumption concern, kept separate from the technical architecture so neither document has to carry the other's kind of change.

## Three consumption paths

1. **Direct library use in AI-powered content apps** (chat UIs, notebook-style tools). A dev imports `core` + whichever domain packs they need, registers components, and renders either hand-authored or LLM-generated markdown directly in their app — via a framework binding (`@basemark/react` today), or with no framework at all using `core`'s own `renderMarkdown()` straight to real DOM (see `examples/vanilla`).
2. **Claude Skills as an authoring surface.** A Skill's job is a user task that happens to produce a document as its output. Instead of handing back plain markdown or a wall of raw HTML, the Skill emits markdown with Basemark directives — using `generateSystemPrompt()`/`describeComponent()` (ARCHITECTURE.md §5) as its own component reference — so the deliverable can embed a real interactive plot/viewer, not just a description of one.
3. **CLI renders that doc to one shareable static HTML file.** The user is left with a markdown(+directives) file; `@basemark/cli` resolves it and produces a single self-contained `.html` — open it in any browser, send it to anyone, no build step and no framework runtime required on the recipient's end.

## Why this isn't a pivot

Each path leans on a decision that was already made for a different reason:

- **Tier 1/2 directives are cheap and reliable for an LLM to emit** (ARCHITECTURE.md §3's actual reason for choosing `remark-directive` over raw HTML: fewer tokens, unambiguous grammar). That's precisely the property path 2 depends on.
- **`generateSystemPrompt()` / `describeComponent()`** (`packages/core/src/prompt.ts`) already give a Skill exactly what it needs for its own prompt: a compact index of registered directives (name + title, scoped by `domain` if needed) plus full title/description/prop-schema detail on demand for whichever component gets picked — cost proportional to what's used, not to registry size.
- **The parser fails visibly, never silently** (`parse.ts`'s `basemark-error` node, ARCHITECTURE.md §3 mitigation #4) — an LLM-authored doc with a hallucinated directive or a wrong prop type surfaces as a visible broken-component card in the rendered output, not a silent content gap or a crash.
- **Web-components-as-default** (ARCHITECTURE.md §6) is what makes path 3 possible at all: a plain custom element with no framework dependency is exactly what's inlinable into one static HTML file. This was chosen for cross-framework portability, but it's equally what "renders in any browser with no build step" requires — same property, different beneficiary.
- **`ComponentRegistry.list()`** already exposes everything registered, which a bundling step needs in order to know which tags a given doc actually resolved to.

Path 1 is the only one built and validated end-to-end today. Paths 2 and 3 are not wired up — `packages/cli` is still a stub — but nothing above is a change in direction, only a name for where the existing pieces were already pointing. (Check README.md for the current state of each package rather than trusting a status claim written here — that's the drift this file is trying to avoid.)

## Open questions specific to this vision

- **Bundling strategy (the main open design question).** A shareable HTML file must inline only the JS/CSS for directives *actually present* in that specific doc — not every component across every registered pack. The naive approach (bundle everything a consumer app registered) means a one-paragraph doc with a single `::locuszoom-assoc` ships all six LocusZoom variants' JS. The CLI's render step needs to parse first, collect the set of tags actually resolved, then selectively bundle only those.
- **"Self-contained" is JS/CSS-only, not data.** LocusZoom's components call live third-party APIs at render time (UMich portaldev, the LD server, gnomAD) — the same way the upstream LocusZoom.js demo does. A "share this HTML file" promise is about not needing a build step or framework runtime, not about working offline or reproducing the exact data a viewer saw months later. Worth deciding explicitly whether that's an acceptable definition of "shareable" here, or whether the CLI should also support snapshotting fetched responses into the file for point-in-time reproducibility.
- **No-JS / old-browser fallback is still undefined** — this sharpens the existing SSR-fallback gap (ARCHITECTURE.md §10) rather than adding a new one: "send someone a link and it just works" raises the cost of that gap being unresolved.
- **Claude Skills integration doesn't exist yet** — no actual skill wired to call `generateSystemPrompt()`/`describeComponent()`, and no worked example of what such a skill's prompt or output would look like end to end.
- **SSRF/tracking surface, revisited.** ARCHITECTURE.md §4 already flags arbitrary client-fetched URLs as a risk for future Tier 3/4 components that accept a raw URL. A CLI that bundles and executes a document authored by someone else (rather than the app owner) makes that the same concern from a different angle — worth remembering once any component's schema accepts an author-supplied URL instead of a fixed/allowlisted source.
