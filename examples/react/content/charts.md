# The genotyping core's Q3 report

Every quarter, the genotyping core you were onboarded into on the Common page reports back to the department on throughput and quality. This is that report — built entirely from `@basemark/charts`'s seven guided directives, each one inline comma-separated data with nowhere to host a file, mounted here via `MarkdownRenderer` from `@basemark/react`, the same generic `@lit/react` wrapper as every other page.

## Throughput held up, even as volume grew

Samples processed climbed every month this quarter — worth checking whether quality kept pace with volume before calling that a win.

::bar-chart{labels="Jul,Aug,Sep" values="420,510,610" title="Samples processed per month"}

It did: the QC pass rate barely moved even as monthly volume grew by nearly half.

::line-chart{labels="Jul,Aug,Sep" values="97.2,96.8,97.5" title="QC pass rate (%)"}

## Where quality actually comes from

Pass rate alone doesn't say why some runs are cleaner than others. Plotting mean sequencing depth against Phred quality score, one point per run, makes the relationship obvious — the runs the core deliberately over-sequences are the same ones with the fewest QC flags.

::scatter-chart{xValues="18,22,25,30,34,38,42,45" yValues="31,33,34,36,37,38,39,40" title="Sequencing depth vs. mean Phred score"}

## What actually got run

Not every sample this quarter was a routine genotyping panel. A quick breakdown by assay type shows the core is still mostly single-gene panels, with whole-exome and whole-genome runs a smaller but steady share.

::pie-chart{labels="Single-gene panel,Whole-exome,Whole-genome,Structural variant" values="58,22,12,8" title="Runs by assay type"}

## How this quarter's NovaSeq run stacks up

The NovaSeq's most recent performance run, scored across the dimensions that actually matter for handing results back to a clinician, against the instrument's own baseline spec:

::radar-chart{labels="Read depth,Q30 rate,Cluster density,Duplication rate,Turnaround" values="9,8,7,8,6" title="NovaSeq run vs. baseline spec"}

## Where samples actually drop out

Every sample that enters extraction doesn't make it to a reported result — the funnel below is why last quarter's capacity-planning numbers assumed a real attrition rate instead of a perfect one.

::funnel-chart{labels="Extracted,Library prepped,Sequenced,QC passed,Reported" values="640,598,571,556,542"}

## And the number leadership actually asks for

Above every other metric this quarter, the one number that gets asked about in the department meeting is uptime — the NovaSeq's scheduled-vs-actual availability.

::gauge-chart{value="94" title="NovaSeq uptime (%)"}

## Charts compose with layout components

Nothing chart-specific about this — any component nests inside `:::card`/`:::columns` the same way, which is how this report gets split by instrument when it goes to the two-sequencer sites.

::::columns{cols="2"}
:::card{title="NovaSeq site"}
::bar-chart{labels="Jul,Aug,Sep" values="310,380,455" title="NovaSeq-only volume"}
:::

:::card{title="MinION site"}
::bar-chart{labels="Jul,Aug,Sep" values="110,130,155" title="MinION-only volume"}
:::
::::
