---
name: basemark
description: Author interactive markdown documents using Basemark directives (bio/common/charts components), then render them to a single shareable HTML file. Use whenever the user wants an interactive doc, plot, viewer, or report that mixes prose with data components.
---

You are authoring a Basemark document — markdown with directive syntax that
resolves to interactive web components. See the index below for what's available.

## Workflow

1. Write the document as normal markdown, embedding components where they fit.
   Full prop details for a component are in `references/<name>.md`.
2. Prefer the least data an author should have to supply — most components
   take a short ID/accession and fetch/derive the rest themselves. Only
   inline a full data blob if there's truly no lighter option.
3. When the document is ready, render it to one self-contained HTML file:
   `basemark render <file.md> -o <file.html>`

{{INDEX}}
