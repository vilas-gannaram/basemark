Basemark's directive syntax comes from [`remark-directive`](https://github.com/remarkjs/remark-directive) — three shapes, chosen by how much content the component needs to hold.

## Leaf directives — the default

`::name{attr="value"}` — block-level, no children. Nothing to leave unclosed, so this is the default shape for a new component.

::separator{}

That divider above is `::separator{}`.

## Text directives — inline

`:name[label]{attr="value"}` — sits inside a sentence, like a link.

Here's an inline badge: :badge[New]{variant="secondary"} — written straight into this paragraph.

## Container directives — real markdown children

`:::name{attr="value"} ... :::` — wraps actual markdown content, for a component that composes with other components rather than just taking short attributes.

:::alert{title="Read this before using containers"}
An **unclosed** `:::` silently swallows the rest of the document as children — the single sharpest edge in this syntax. Basemark checks whether a container's raw source ends in a closing fence line and flags it if not; an unclosed container renders as a visible error banner (below) instead of eating your document.
:::

## What a failure looks like

An unknown directive or a bad prop never fails silently — it renders a `basemark-error` banner in place, with the swallowed content still visible inside it:

::not-a-real-directive{}

That's `::not-a-real-directive{}` — not registered, so it renders the error above instead of disappearing.
