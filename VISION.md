See [README.md](README.md) for what Basemark is and its current status, and [ARCHITECTURE.md](ARCHITECTURE.md) for the technical design. This file covers who uses Basemark and how.

## Three consumption paths

1. **Direct library use in AI-powered content apps** (chat UIs, notebook-style tools). A dev imports `core` plus whichever domain packs they need, registers components, and renders markdown (hand-authored or LLM-generated) via a framework binding (`@basemark/react` today) or with no framework at all via `core`'s own `renderMarkdown()` (see `examples/vanilla`).
2. **Claude Skills as an authoring surface.** A Skill emits markdown with Basemark directives instead of plain markdown or raw HTML, using `generateSystemPrompt()`/`describeComponent()` (ARCHITECTURE.md §5) as its component reference — so its output can embed a real interactive plot or viewer, not just describe one.
3. **CLI renders a doc to one shareable static HTML file.** `@basemark/cli` resolves a markdown(+directives) file into a single self-contained `.html` — open it in any browser, no build step or framework runtime needed.
