Every `@basemark/common` directive, in one page. Rendered server-side via `renderMarkdownToHtml()` into static HTML, then upgraded client-side into real custom elements — the same two-step path every narrative page on this site uses. This exact markdown also renders unchanged through `examples/vanilla`'s `renderMarkdown()` and `examples/react`'s `MarkdownRenderer`.

## Alert

:::alert{title="Default"}
Informational callout with a title and body.
:::

:::alert{variant="destructive" title="Destructive"}
Use for errors or anything requiring immediate attention.
:::

## Badge

:badge[Default]{} :badge[Secondary]{variant="secondary"} :badge[Outline]{variant="outline"} :badge[Destructive]{variant="destructive"}

## Button

:button[Default]{} :button[Secondary]{variant="secondary"} :button[Outline]{variant="outline"} :button[Ghost]{variant="ghost"} :button[Link]{variant="link" href="https://ui.shadcn.com"} :button[Destructive]{variant="destructive"} :button[Small]{size="sm"} :button[Large]{size="lg"}

## Separator

Content above.

::separator{}

Content below.

## Table

Plain GFM tables render with no directive needed:

| Column A | Column B | Status |
| --- | --- | --- |
| Row one | Value | `stable` |
| Row two | Value | `experimental` |

## Accordion

::::accordion
:::accordion-item{label="First item"}
Body of the first item.
:::

:::accordion-item{label="Second item"}
Body of the second item.
:::
::::

## Carousel

Any direct child block works as a slide — `card` here, but a bare image works the same way (next section).

::::carousel
:::card{title="Slide one"}
First slide's content.
:::

:::card{title="Slide two"}
Second slide's content.
:::

:::card{title="Slide three"}
Third slide's content.
:::
::::

Bare images as slides:

::::carousel
![Lab microscope](https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80)

![Pipetting samples](https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&q=80)

![Petri dishes](https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&q=80)
::::

## Popover

:::popover{trigger="Click to see more" side="bottom"}
Popover body content, positioned relative to the trigger.
:::

## Video

URL-only — provider and embed ID are detected automatically:

::video{url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"}

## Audio

Also URL-only, and provider-agnostic:

::audio{url="https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC"}

::audio{url="https://soundcloud.com/forss/flickermood"}

## Card

:::card{title="Card title"}
Card body content.
:::

## Columns

::::columns{cols="2"}
:::card{title="Left"}
Left column content.
:::

:::card{title="Right"}
Right column content.
:::
::::

## Tabs

::::tabs
:::tab-panel{label="First tab"}
Content of the first tab.
:::

:::tab-panel{label="Second tab"}
Content of the second tab.
:::
::::

## Code blocks

Fenced code blocks get syntax highlighting via `rehype-highlight`, wired into `@basemark/core`'s parse pipeline:

```ts
import { createRegistry } from '@basemark/core';
import { registerCommonComponents } from '@basemark/common';

const registry = createRegistry();
registerCommonComponents(registry);
```

## Appendix: failing visibly

Basemark fails loudly, not silently, when a directive is wrong. An unknown directive:

::not-a-real-component{foo="bar"}

A container missing its closing fence — everything below gets captured inside it instead of rendering separately, and the error banner shows exactly what was swallowed:

:::card{title="Unclosed"}
This text is inside the broken card.

## This heading got swallowed too

So did this paragraph.
