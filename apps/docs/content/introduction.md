Basemark lets you write plain markdown and embed live, interactive components — protein viewers, molecule viewers, genomic tracks, charts — using a short directive instead of hand-written HTML or a JS framework.

:::card{title="A directive, rendered"}
This whole page is Basemark markdown. The card you're reading right now is `:::card{title="..."} ... :::` — an ordinary custom element, upgraded in your browser, no build step for you to run.
:::

## Three ways to use it

- **Directly in an app.** Import `@basemark/core` plus whichever component packs you need (`bio`, `common`, `charts`, `chem`), register them, and render — with React (`@basemark/react`) or with nothing at all (`renderMarkdown()`).
- **As a Claude Skill's output format.** A Skill can emit Basemark directives instead of plain markdown, so its output embeds a real interactive viewer instead of just describing one.
- **As a shareable file.** `basemark render doc.md -o doc.html` resolves a markdown file into one self-contained HTML file — open it in any browser, no server or build step needed.

## Where to go next

:button[Get started →]{href="/getting-started" variant="default"} :button[Browse components]{href="/components/common" variant="outline"}
