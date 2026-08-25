# @basemark/common

General-purpose components for Markdown — cards, tabs, accordions, alerts, media embeds, and more, styled against a shadcn-compatible theme. Not domain-specific — see `@basemark/bio`/`@basemark/charts`/`@basemark/chem` for those.

## Install

```sh
bun add @basemark/core @basemark/common
```

## Usage

```ts
import { createRegistry, renderMarkdown } from '@basemark/core';
import { registerCommonComponents } from '@basemark/common';

const registry = createRegistry();
registerCommonComponents(registry);

renderMarkdown(':::card{title="Hello"}\nSome content.\n:::', registry);
```

In React, use `@basemark/react`'s `MarkdownRenderer` instead of calling `renderMarkdown` directly:

```tsx
import { MarkdownRenderer } from '@basemark/react';

<MarkdownRenderer source={':::card{title="Hello"}\nSome content.\n:::'} registry={registry} />;
```

## Components

### Layout & containers

- `card` — bordered container with an optional title
- `columns` — lays child blocks side by side in a grid
- `tabs` / `tab-panel` — switchable panel group

### UI elements

- `button` — link or button styling
- `badge` — small status label
- `alert` — callout box
- `separator` — divider line
- `accordion` / `accordion-item` — collapsible sections
- `carousel` — scrollable slide track
- `popover` — click-to-open panel
- **table** — plain GFM pipe-table syntax, themed automatically (not a directive)

### Media embeds

- `video` — YouTube or Vimeo, from a normal share URL
- `audio` — Spotify or SoundCloud, from a normal share URL

## Coming soon

- Mermaid diagrams (flowcharts, Gantt charts, etc.)
- KaTeX math rendering
- Sortable tables
- Maps (MapLibre/Leaflet)
- Citations (BibTeX)
- JSON/tree viewers
- More shadcn-inspired components (dialog, dropdown menu, tooltip)

---

Bio components (protein structures, sequences, variants, ...) are a separate package — see `@basemark/bio`. Chart components (ECharts) are also separate — see `@basemark/charts`.
