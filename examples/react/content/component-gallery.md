# Common component gallery

This page exercises every `@basemark/common` component, including the shadcn/ui-inspired set (see `packages/common/README.md`), rendered here through `MarkdownRenderer` exactly like every other page: each resolves to a real React component via the generic `@lit/react` wrapper, not per-component code.

## Code

Inline code like `registerCommonComponents(registry)` is themed globally in `theme.css`, not a directive. Fenced code blocks get syntax highlighting too, via `rehype-highlight` wired into `@basemark/core`'s parse pipeline:

```ts
import { createRegistry } from '@basemark/core';
import { registerCommonComponents } from '@basemark/common';

const registry = createRegistry();
registerCommonComponents(registry);
```

## Buttons & badges

Both are text directives, inline in a sentence: :button[Default]{} :button[Secondary]{variant="secondary"} :button[Destructive]{variant="destructive"} :button[Outline]{variant="outline"} :button[Ghost]{variant="ghost"} :button[Link]{variant="link"}, in :button[small]{size="sm"}, default, and :button[large]{size="lg"} sizes, and :button[as a link]{variant="outline" href="https://ui.shadcn.com"} when `href` is set.

Badges: :badge[Beta]{} :badge[Stable]{variant="secondary"} :badge[Deprecated]{variant="destructive"} :badge[Experimental]{variant="outline"}.

## Alert

:::alert{title="Heads up"}
Default variant — a neutral notice that deserves more attention than a plain paragraph.
:::

:::alert{variant="destructive" title="Something needs attention"}
Destructive variant — warnings or errors.
:::

## Separator

::separator{}

## Table

Plain GFM pipe-table syntax — not a directive, themed globally in `theme.css`:

| Variant | Use for |
| --- | --- |
| `default` | primary action / neutral emphasis |
| `secondary` | lower-emphasis action |
| `destructive` | dangerous or error-adjacent action |
| `outline` / `ghost` | de-emphasized, chrome-light action |

## Accordion

::::accordion
:::accordion-item{label="Why a generic React wrapper instead of per-component wrappers?"}
Every resolved custom element is wrapped once, generically, via `@lit/react`'s `createComponent` — see `MarkdownRenderer` in `@basemark/react`. Works for any custom element, no Lit dependency needed in the component itself.
:::

:::accordion-item{label="What about the native React escape hatch?"}
That's `gene-chip`, used on the Phenome-wide Scan page — a real React component (its own `useState`) registered with `{ type: 'react', component: GeneChip }` instead of a customElements tag. App-local only; never for a published pack like this one.
:::

:::accordion-item{label="Does this work outside React?"}
Yes — every component in this gallery is a plain Web Component. `examples/vanilla` renders the same set with no framework at all, via `@basemark/core`'s own `renderMarkdown()`.
:::
::::

## Carousel

::::carousel
:::card{title="Slide 1"}
Each direct child block of a `:::carousel:::` becomes one full-width, snap-aligned slide.
:::

:::card{title="Slide 2"}
Sliding is pure CSS `scroll-snap` — the prev/next buttons just nudge `scrollLeft`.
:::

:::card{title="Slide 3"}
Native swipe/trackpad/shift+wheel scrolling works too, for free.
:::
::::

## Popover

A click-to-open panel anchored to a trigger button, closing on outside click or Escape:

:::popover{trigger="Why not Tailwind?" side="bottom"}
The common package targets plain CSS3 against shadcn-shaped custom properties, so it renders identically whether the host page uses Tailwind, another CSS framework, or nothing at all.
:::

## Images

Ordinary `![alt](url)` Markdown — not a directive, no component involved. `remark-parse` turns it straight into a plain `<img>` in the hast tree, same bucket as headings/tables/code, so it already worked before any of the components above existed. It also composes with `:::carousel:::` for free — each image's own paragraph is just another direct child block, same as the card slides in the Carousel section above:

::::carousel
![Lab microscope](https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80)

![Pipetting samples](https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&q=80)

![Petri dishes](https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&q=80)
::::

## Media embeds

Tier 0 — just a page URL, provider and embed ID are both detected from it:

::video{url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"}

::audio{url="https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC"}

::audio{url="https://soundcloud.com/forss/flickermood"}
