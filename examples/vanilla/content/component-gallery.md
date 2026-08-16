# Component gallery

This page exists purely to exercise every `@basemark/common` component in one place, including the shadcn/ui-inspired set — see `packages/common/README.md` for the full build status.

### Buttons & badges

Both are text directives, so they sit inline in a sentence: :button[Default]{} :button[Secondary]{variant="secondary"} :button[Destructive]{variant="destructive"} :button[Outline]{variant="outline"} :button[Ghost]{variant="ghost"} :button[Link]{variant="link"}, in small :button[Small]{size="sm"}, default, and large :button[Large]{size="lg"} sizes — and :button[as a link]{variant="outline" href="https://ui.shadcn.com"} when `href` is set.

Badges work the same way: status :badge[Beta]{} :badge[Stable]{variant="secondary"} :badge[Deprecated]{variant="destructive"} :badge[Experimental]{variant="outline"}.

### Alert

:::alert{title="Heads up"}
The default variant, for a neutral notice that deserves more attention than a plain paragraph.
:::

:::alert{variant="destructive" title="Something needs attention"}
The destructive variant, for warnings or errors — e.g. a deprecated prop or a required migration step.
:::

### Separator

A themed divider line, as an alternative to a plain markdown `---` when it should read as UI chrome:

::separator{}

### Table

Plain GFM pipe-table syntax, themed globally in `theme.css` — not a directive at all:

| Component | Directive form | Tier |
| --- | --- | --- |
| Button | text (`:button[...]`) | shadcn-inspired |
| Alert | container (`:::alert`) | shadcn-inspired |
| Table (this one) | plain GFM markdown | n/a |

### Accordion

::::accordion
:::accordion-item{label="What is Basemark?"}
Markdown + directives → web components — see the GWAS variant report page for it in action.
:::

:::accordion-item{label="Why not Tailwind?"}
The common package is deliberately plain CSS3 against shadcn-shaped custom properties, so it works anywhere a Web Component works, with no build-time CSS dependency.
:::

:::accordion-item{label="Can I theme it?"}
Yes — override `--primary`, `--radius`, etc. in `theme.css` (or your own page's `:root`), and every component picks them up through the shadow boundary automatically.
:::
::::

### Carousel

::::carousel
:::card{title="Slide 1"}
Each direct child block of a `:::carousel:::` becomes one full-width, snap-aligned slide.
:::

:::card{title="Slide 2"}
Sliding is pure CSS `scroll-snap` — the prev/next buttons below just nudge `scrollLeft`.
:::

:::card{title="Slide 3"}
Native swipe/trackpad/shift+wheel scrolling works too, for free.
:::
::::

### Popover

A click-to-open panel anchored to a trigger button, closing on outside click or Escape:

:::popover{trigger="Why oklch?" side="bottom"}
`oklch()` keeps perceived lightness consistent across hues, so swapping the theme's accent color doesn't accidentally make text unreadable against `--foreground`.
:::

## Appendix: failing visibly

Basemark's other job is to fail loudly, not silently, when a directive is wrong. An unknown directive:

::not-a-real-component{foo="bar"}

And a container missing its closing fence — everything below gets captured inside it instead of rendering separately, and the error banner shows exactly what was swallowed:

:::card{title="Unclosed"}
This text is inside the broken card.

## This heading got swallowed too

So did this paragraph.
