# Bio component showcase

Every `@basemark/bio` directive, in one page. No React, no framework binding — `renderMarkdown()` from `@basemark/core` hands back a real `DocumentFragment` of already-upgraded custom elements. This page's markdown lives in `content/bio.md`, loaded via Vite's `?raw` import.

## Protein sequence & structure

TCF7L2 (also called TCF-4), a Wnt-pathway transcription factor — its full-length domain architecture from UniProt, and the one crystallized structure of it bound to β-catenin.

::::tabs
:::tab-panel{label="Domain architecture (ProtVista)"}
The full TCF7L2 sequence (UniProt Q9NQB0), with its DNA-binding HMG-box domain and other annotated features laid out across the protein.

::protvista{accession="Q9NQB0"}
:::

:::tab-panel{label="Bound to β-catenin (3Dmol.js)"}
PDB entry 1JPW: the crystal structure of a fragment of TCF7L2 in complex with β-catenin, the interaction Wnt signaling actually turns on.

::structure{pdbid="1jpw"}
:::
::::

## Genomic-locus plots (LocusZoom)

All six center on the same locus — *TCF7L2*, `chr10:114,550,452-115,067,678` — the single most replicated genetic association in type 2 diabetes, led by intronic variant **rs7903146**.

:::card{title="Association plot — locuszoom-assoc"}
The region GWAS meta-analyses actually plot: points colored by linkage disequilibrium with the lead variant.

::locuszoom-assoc{chrom="10" start="114550452" end="115067678"}
:::

:::card{title="+ GWAS Catalog hits — locuszoom-gwas-catalog"}
Same association plot, with previously published GWAS Catalog hits labeled directly on it.

::locuszoom-gwas-catalog{chrom="10" start="114550452" end="115067678"}
:::

:::card{title="Fine-mapping — locuszoom-credible-sets"}
The 95% Bayesian credible set — the smallest set of variants 95% likely to contain the true causal one.

::locuszoom-credible-sets{chrom="10" start="114550452" end="115067678"}
:::

:::card{title="Interval annotations — locuszoom-intervals"}
The same association points, plus a track of labeled genomic regions (e.g. chromatin states) beneath them.

::locuszoom-intervals{chrom="10" start="114550452" end="115067678"}
:::

:::card{title="Multi-phenotype overlay — locuszoom-multi-pheno"}
Four related metabolic-trait GWAS (fasting glucose, fasting insulin, triglycerides, total cholesterol) layered on one panel.

::locuszoom-multi-pheno{chrom="10" start="114550452" end="115067678"}
:::

:::card{title="Phenome-wide scan — locuszoom-phewas"}
The inverse view: rs7903146 (`10:114758349_C/T`) scanned across many phenotypes instead of many variants across one.

::locuszoom-phewas{variant="10:114758349_C/T"}
:::

## Genome browser (IGV.js)

A scrollable/zoomable view of raw genomic coordinates — distinct from the association plots above, which show a specific statistic, not "what's actually at this region."

:::card{title="BRAF locus, hg38 (default)"}
::genome-browser{locus="chr7:140753336-140763336"}
:::

:::card{title="A different build — hg19"}
::genome-browser{locus="chr1:1000000-1050000" genome="hg19"}
:::

## Inline sequence & tree (Tier 3 — no fetch)

Short content the author supplies directly, parsed and rendered with no accession lookup. Directives, not fences — see AGENTS.md.

:::card{title="FASTA — ::fasta"}
A short peptide, with residues 10-25 highlighted.

::fasta{sequence="MKVLATTAGARGCGTVVPQKLGDSSPTLQVMGRIAAEQFRSMPGYVDKPFGSLVGA" id="demo-peptide" highlight="10-25"}
:::

:::card{title="Newick tree — ::newick"}
A small phylogenetic tree.

::newick{tree="(Human:0.1,(Chimp:0.08,Gorilla:0.09):0.05,Orangutan:0.15);" title="Great apes"}
:::
