Full narrative documents, one per component pack — each is real Basemark markdown, rendered the same way every other page on this site is.

:::card{title="Bio examples"}
Protein structure & sequence, ClinVar variant cards, six LocusZoom association-plot variants, a genome browser, a KEGG pathway diagram, a STRING interaction network, and Tier 3 FASTA/Newick — all centered on one real GWAS hit.

:button[Open →]{href="/examples/bio" variant="default"}
:::

:::card{title="Common examples"}
Every `@basemark/common` component, inside a lab onboarding page: alerts, badges, buttons, a table, an accordion, a carousel, a popover, media embeds, and Basemark's own fail-visibly error handling.

:button[Open →]{href="/examples/common" variant="default"}
:::

:::card{title="Charts examples"}
A quarterly report built from all seven `@basemark/charts` directives — throughput, a QC trend, a scatter plot, an assay-mix breakdown, an instrument radar, a sample-attrition funnel, and an uptime gauge.

:button[Open →]{href="/examples/charts" variant="default"}
:::

## A short mix, right here

A few components across packages, composed together — proof this whole page is itself one Basemark document, not hand-written HTML describing one.

::::columns{cols="2"}
:::card{title="Layout composes"}
`:::card` nested inside `::::columns{cols="2"}` — one column cell each. Any component can nest inside `:::card`/`:::columns`/`:::tabs` the same way.
:::

:::alert{title="Errors fail visibly" variant="destructive"}
A bad directive never disappears silently — it renders `basemark-error` in place, with whatever content it swallowed still visible inside.
:::
::::

::pie-chart{labels="Bio,Common,Charts" values="8,12,7" title="Components per package"}
