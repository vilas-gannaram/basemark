# Bio component showcase

Every `@basemark/bio` directive, in one page. `MarkdownRenderer` from `@basemark/react` mounts each resolved custom element as a real React component — via a generic wrapper (`@lit/react`'s `createComponent`), not per-component code. This page's markdown lives in `content/bio.md`, loaded via Vite's `?raw` import.

## Protein sequence & structure

:gene-chip[TCF7L2]{full="Transcription factor 7-like 2" chrom="10"} (also called TCF-4), a Wnt-pathway transcription factor — its full-length domain architecture from UniProt, and the one crystallized structure of it bound to β-catenin. (Click the gene name — it's a real React component with its own state, registered through the native escape hatch, ARCHITECTURE.md §6/§10, not a Web Component.)

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

## Variant cards (ClinVar/dbSNP)

Three variants, fetched live from MyVariant.info by rsID — one per ClinVar significance category, so the color coding actually shows something. First is the variant the locus-wide plots below are all about.

::::columns{cols="2"}
:::card{title="rs7903146 — ::variant"}
::variant{rsid="rs7903146" title="TCF7L2 (risk allele)"}
:::

:::card{title="rs28897696 — ::variant"}
::variant{rsid="rs28897696" title="BRCA1 (pathogenic)"}
:::

:::card{title="rs2032582 — ::variant"}
::variant{rsid="rs2032582" title="ABCB1 (benign)"}
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

## Pathway diagram (KEGG)

TCF7L2 sits in the Wnt signaling pathway — the map below is the reference (species-agnostic) diagram for it.

:::card{title="Wnt signaling pathway — ::pathway"}
::pathway{keggid="map04310" title="Wnt signaling pathway (reference)"}
:::

## Interaction network (STRING)

The same TCF7L2–β-catenin relationship from the structure tab above, now as a protein-protein interaction network instead of a 3D structure.

:::card{title="TCF7L2 & CTNNB1 (β-catenin) — ::interaction-network"}
::interaction-network{gene="TCF7L2,CTNNB1" title="TCF7L2 / CTNNB1 interaction network"}
:::

A single gene, with `species` left at its default (human, taxon 9606) — STRING expands it to its own top interaction partners automatically.

:::card{title="TP53 alone (default-expanded)"}
::interaction-network{gene="TP53" title="TP53 interaction network"}
:::

Same idea in mouse (taxon 10090) instead of human — the `species` attr is any NCBI taxonomy ID, not just the default.

:::card{title="Insulin signaling, mouse — Tcf7l2/Ctnnb1/Ins1/Insr"}
::interaction-network{gene="Tcf7l2,Ctnnb1,Ins1,Insr" species="10090" title="Insulin signaling network (mouse)"}
:::

## Inline sequence & tree (Tier 3 — no fetch)

Short content the author supplies directly, parsed and rendered with no accession lookup. Directives, not fences — see AGENTS.md.

:::card{title="FASTA — ::fasta"}
A short peptide, with residues 10-25 highlighted.

::fasta{sequence="MKVLATTAGARGCGTVVPQKLGDSSPTLQVMGRIAAEQFRSMPGYVDKPFGSLVGA" id="demo-peptide" highlight="10-25"}
:::

:::card{title="Newick tree — ::newick"}
A small phylogenetic tree, branch lengths drawn to scale.

::newick{tree="(Human:0.1,(Chimp:0.08,Gorilla:0.09):0.05,Orangutan:0.15);" title="Great apes"}
:::

No branch lengths given at all — every branch falls back to equal spacing, so this renders as a pure cladogram (topology only, no evolutionary-distance meaning).

:::card{title="Topology only, no branch lengths"}
::newick{tree="(A,(B,C),(D,E));" title="Unscaled topology"}
:::

A slightly deeper tree, mixing very short (primate) and much longer (fish-vs-mammal) branch lengths in the same plot.

:::card{title="Vertebrate phylogeny"}
::newick{tree="((Human:0.006,Chimp:0.006):0.003,(Mouse:0.03,Rat:0.03):0.02,Zebrafish:0.15);" title="Vertebrates"}
:::
