Every `@basemark/charts` directive, in one page — all seven take inline comma-separated data, with nowhere to host a file. Rendered server-side via `renderMarkdownToHtml()`, then upgraded client-side into real custom elements, same as every other page on this site.

## Bar chart

::bar-chart{labels="Jul,Aug,Sep" values="420,510,610" title="Samples processed per month"}

## Line chart

::line-chart{labels="Jul,Aug,Sep" values="97.2,96.8,97.5" title="QC pass rate (%)"}

## Scatter chart

::scatter-chart{xValues="18,22,25,30,34,38,42,45" yValues="31,33,34,36,37,38,39,40" title="Sequencing depth vs. mean Phred score"}

## Pie chart

::pie-chart{labels="Single-gene panel,Whole-exome,Whole-genome,Structural variant" values="58,22,12,8" title="Runs by assay type"}

## Radar chart

::radar-chart{labels="Read depth,Q30 rate,Cluster density,Duplication rate,Turnaround" values="9,8,7,8,6" title="NovaSeq run vs. baseline spec"}

## Funnel chart

::funnel-chart{labels="Extracted,Library prepped,Sequenced,QC passed,Reported" values="640,598,571,556,542"}

## Gauge chart

::gauge-chart{value="94" title="NovaSeq uptime (%)"}

## Composing with layout components

Nothing chart-specific here — any component nests inside `:::card`/`:::columns` the same way any other component does.

::::columns{cols="2"}
:::card{title="Site A"}
::bar-chart{labels="Jul,Aug,Sep" values="310,380,455" title="Site A volume"}
:::

:::card{title="Site B"}
::bar-chart{labels="Jul,Aug,Sep" values="110,130,155" title="Site B volume"}
:::
::::
