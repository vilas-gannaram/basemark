# Genome browser demo

`@basemark/bio`'s newest directive — a scrollable/zoomable view of a genomic locus via IGV.js, distinct from the `locuszoom-*` plots (one specific association-plot type) and `structure`/`protvista` (3D structure / protein sequence, not genomic DNA coordinates).

Only IGV.js's built-in reference genomes are supported — `genome="hg38"` (the default) or any other built-in ID (`hg19`, `mm39`, ...). No custom track URLs (BAM/VCF/BED) yet — see `packages/bio/README.md`'s "Known gaps".

## Default genome (hg38)

::genome-browser{locus="chr7:140753336-140763336"}

That's the *BRAF* locus — `::genome-browser{locus="chr7:140753336-140763336"}`.

## A different build

::genome-browser{locus="chr1:1000000-1050000" genome="hg19"}
