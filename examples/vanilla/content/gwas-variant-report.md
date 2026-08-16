# TCF7L2: from statistical signal to protein structure

No React, no framework binding at all — every component on this page is mounted by `renderMarkdown()` from `@basemark/core`, which hands back a real `DocumentFragment` of already-upgraded custom elements. This page's own markdown lives in `content/gwas-variant-report.md`, loaded via Vite's `?raw` import — not a JS string.

*TCF7L2* is the single most replicated genetic association in type 2 diabetes: the intronic variant **rs7903146** has turned up in essentially every T2D GWAS run since 2006, in every population it has been tested in. The report below walks from that statistical signal down to the protein it implicates.

:::card{title="The association signal"}
This is the region GWAS meta-analyses actually plot: a roughly 500kb window around rs7903146 on chromosome 10, colored by linkage disequilibrium with the lead variant.

::locuszoom-assoc{chrom="10" start="114550452" end="115067678"}
:::

A single peak is suggestive, but not proof — the next two views ask "does this match other known hits nearby?" and "how far can the signal itself be narrowed down?", side by side.

::::columns{cols="2"}
:::card{title="Known GWAS hits nearby"}
The same region, with previously published GWAS Catalog hits labeled directly on the plot.

::locuszoom-gwas-catalog{chrom="10" start="114550452" end="115067678"}
:::

:::card{title="Statistical fine-mapping"}
The 95% Bayesian credible set for this locus — the smallest set of variants that is 95% likely to contain the true causal one, computed straight from the association p-values.

::locuszoom-credible-sets{chrom="10" start="114550452" end="115067678"}
:::
::::

A p-value only tells you *where* to look. To understand *why* this particular gene keeps coming up, zoom into the protein itself — TCF7L2 (also called TCF-4) is a transcription factor in the Wnt signaling pathway, and its two faces below are worth telling apart.

:::::card{title="From gene to protein"}
One protein, two very different views: its full-length domain architecture from UniProt, and the one crystallized structure of it in complex with its binding partner.

::::tabs
:::tab-panel{label="Domain architecture"}
The full TCF7L2 sequence (UniProt Q9NQB0), with its DNA-binding HMG-box domain and other annotated features laid out across the protein.

::protvista{accession="Q9NQB0"}
:::

:::tab-panel{label="Bound to β-catenin"}
PDB entry 1JPW: the crystal structure of a fragment of TCF7L2 in complex with β-catenin — the interaction Wnt signaling actually turns on. It has nothing to do with the HMG-box/DNA binding shown in the sequence view; this is a separate part of the same protein, doing a separate job.

::structure{pdbid="1jpw"}
:::
::::
:::::

That is the whole arc: a variant with an overwhelming statistical signal, and a protein whose known structural biology gives that signal a mechanism worth investigating further.
