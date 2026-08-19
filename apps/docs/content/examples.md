A short showcase, mixing components across packages — this whole page is one Basemark document.

::::columns{cols="2"}
:::card{title="Layout composes"}
`:::card` nested inside `::::columns{cols="2"}` — one column cell each. Any component can nest inside `:::card`/`:::columns`/`:::tabs` the same way.
:::

:::alert{title="Errors fail visibly" variant="destructive"}
A bad directive never disappears silently — it renders `basemark-error` in place, with whatever content it swallowed still visible inside.
:::
::::

## A chart, inline

::pie-chart{labels="Bio,Common,Charts" values="8,12,7" title="Components per package"}

## More to read

For fuller, real-world documents — a GWAS variant report, a lab protocol, a full component gallery — see this repo's `examples/vanilla` and `examples/react` apps, which render the same directive syntax through `@basemark/core` directly and through `@basemark/react`, respectively.
