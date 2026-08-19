# @basemark/bio

Bioinformatics components for Markdown. Write a short identifier — an accession, a PDB ID, an rsID, a locus — and get back a real, interactive viewer: protein structures, sequence tracks, clinical variants, pathway maps, interaction networks, genome browsing, and more.

## Usage

```ts
import { createRegistry, renderMarkdown } from '@basemark/core';
import { registerBioComponents } from '@basemark/bio';

const registry = createRegistry();
await registerBioComponents(registry);

renderMarkdown('::structure{pdbid="1cbs"}', registry);
```

Each component below is a directive you write directly in Markdown, e.g. `::protvista{accession="P05067"}`.

## Components

### Protein structure & sequence

- `structure` — 3D protein structure from a PDB entry (3Dmol.js)
- `protvista` — UniProt sequence, domain, and feature tracks (ProtVista)

### Variants & clinical genomics

- `variant` — a ClinVar/dbSNP variant card from an rsID: gene, position, allele, clinical significance, associated conditions, and a CADD score

### Genomic loci & association plots

- `locuszoom-assoc` — regional GWAS association plot
- `locuszoom-gwas-catalog` — association plot with published GWAS Catalog hits labeled
- `locuszoom-phewas` — phenome-wide association scan for one variant
- `locuszoom-intervals` — association plot with interval/regulatory annotations
- `locuszoom-credible-sets` — 95% Bayesian credible set for fine-mapping
- `locuszoom-multi-pheno` — several related phenotypes overlaid on one locus
- `genome-browser` — scrollable, zoomable genome browser for a locus (IGV.js)

### Pathways & networks

- `pathway` — a KEGG pathway diagram from a pathway ID
- `interaction-network` — a protein-protein interaction network from one or more gene names (STRING)

### Sequences & phylogenetics

- `fasta` — a sequence viewer with a position ruler, residue coloring, and highlightable ranges
- `newick` — a phylogenetic tree from Newick-format text

## Coming soon

- `gene` — Ensembl gene track
- AlphaFold predicted structures, for proteins without a solved PDB entry
- Karyotype/ideogram — chromosome-level view with cytobands
- Taxonomy/species tree
- RNA secondary structure
- Sequence logo / motif viewer
- Plasmid / circular map viewer
- Pedigree chart
- Multiple sequence alignment (MSA) viewer
- Whole-slide/microscopy imaging

---

`locuszoom-tabix` (tabix-indexed files) is implemented but not registered by default — a known vendored-dependency issue under strict ESM. Call `registerTabix()` directly to opt in.

Chemistry components (SMILES, PubChem, reaction schemes) are a separate package — see `packages/chem` (not started yet).
