See [README.md](README.md) for what Basemark is and its current status, and [ARCHITECTURE.md](ARCHITECTURE.md) for the technical design. This file covers who uses Basemark and how.

## Three consumption paths

1. **Direct library use in AI-powered content apps** (chat UIs, notebook tools). Import `core` + whichever domain packs you need, register components, render via `@basemark/react` or no framework at all (`core`'s own `renderMarkdown()`, see `examples/vanilla`).
2. **Claude Skills as an authoring surface.** A Skill emits Basemark directives instead of plain markdown, using `generateSystemPrompt()` (ARCHITECTURE.md §5) as its component reference — output can embed a real interactive viewer, not just describe one.
3. **CLI renders a doc to one shareable static HTML file.** `@basemark/cli` resolves markdown(+directives) into a single self-contained `.html` — open in any browser, no build step needed.
