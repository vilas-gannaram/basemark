# @basemark/bio

Domain components for bioinformatics authors. See [ARCHITECTURE.md](../../ARCHITECTURE.md) §8 for the tiering rationale behind this catalog.

## Status vs. the original plan

The original plan had one Tier-2 idea for genomic-locus plots: `::locus{chr start end}`. What got built instead is a suite of six registered LocusZoom-family directives (plus a seventh, built but not wired in by default):

- `::locuszoom-assoc{chrom start end}` — GWAS association plot
- `::locuszoom-gwas-catalog{chrom start end}` — + GWAS Catalog annotations
- `::locuszoom-phewas{variant}` — Phenome-wide association plot
- `::locuszoom-intervals{chrom start end}` — + interval annotations
- `::locuszoom-credible-sets{chrom start end}` — 95% credible set plot
- `::locuszoom-multi-pheno{chrom start end}` — layered multi-phenotype plot
- `::locuszoom-tabix{chrom start end}` — tabix-indexed files. Built, but **not** called from `registerLocusZoomComponents` — blocked by real bugs in `tabix-reader`'s vendored jszlib that only surface under ESM strict mode. Call `registerTabix(registry)` directly if you want it despite the crash risk; see `src/locuszoom/index.ts`.

Everything below this point is still exactly as originally planned — nothing else in this package has been started.

## Tier 1 — single ID

- [ ] `::protvista{accession="..."}` — UniProt sequence/domain/feature tracks (via ProtVista or its newer modular successor, Nightingale)
- [ ] `::structure{pdbId="..."}` — 3D protein structure (Mol*, NGL, or 3Dmol.js)
- [ ] `::variant{rsid="..."}` — ClinVar/dbSNP variant card
- [ ] `::gene{ensembl="..."}` — Ensembl gene track
- [ ] `::pathway{keggId="..."}` — KEGG pathway diagram (Reactome is the alternative source)

## Tier 2 — composite key

- [x] `::locus{chr="7" start="..." end="..."}` — genomic region plot, the original LocusZoom idea → built as the `locuszoom-*` suite above instead of one generic `::locus` directive
- [ ] `::genome-browser{locus="chr7:..."}` — IGV.js or JBrowse 2 embed
- [ ] `::interaction-network{gene="TP53" db="string"}` — protein-protein interaction network via STRING

## Tier 3 — inline literal

- [ ] ` ```fasta ` fence — short sequence, feature-highlightable
- [ ] ` ```newick ` fence — small phylogenetic tree (Phylotree.js, iTOL-style rendering)

## Also mentioned, not yet tiered/formalized

- [ ] MSA (multiple sequence alignment) viewer — MSAViewer / AlignmentViewer 2
- [ ] Whole-slide/microscopy imaging — OpenSeadragon, for pathology slide deep-zoom. Shape differs from the rest of this list — likely Tier 2/4 since it needs a tile-source URL rather than a short ID.

---

Chem components (SMILES/RDKit, PubChem CID, reaction schemes) are a separate package — see `packages/chem` (not yet started).
