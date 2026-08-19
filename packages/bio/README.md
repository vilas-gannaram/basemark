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

## Tier 1 — single ID

- [x] `::protvista{accession="..."}` — UniProt sequence/domain/feature tracks (ProtVista/UniProt)
- [x] `::structure{pdbid="..."}` — 3D protein structure (3Dmol.js)
- [ ] `::variant{rsid="..."}` — ClinVar/dbSNP variant card
- [ ] `::gene{ensembl="..."}` — Ensembl gene track
- [x] `::pathway{keggid="..." title="..."}` — KEGG pathway diagram, rendered as a static image from KEGG's own REST API (`rest.kegg.jp`) — not the interactive KGML map, which is server-rendered HTML with its own JS (Reactome is the alternative source, not used here)

## Tier 2 — composite key

- [x] `::locus{chr="7" start="..." end="..."}` — genomic region plot, the original LocusZoom idea → built as the `locuszoom-*` suite above instead of one generic `::locus` directive
- [x] `::genome-browser{locus="chr7:..."}` — IGV.js embed. Only IGV.js's built-in reference genomes are supported (`genome="hg38"` etc.) — no custom track URLs (BAM/VCF/BED), same reasoning as `@basemark/charts` dropping its hosted-file mode: no client-side fetch of a caller-supplied URL until a real allowlist/proxy exists (ARCHITECTURE.md §4).
- [ ] `::interaction-network{gene="TP53" db="string"}` — protein-protein interaction network via STRING

## Tier 3 — inline literal

- [x] `::fasta{sequence="..." highlight="10-25"}` — short sequence, feature-highlightable (leaf directive, not a fence — see AGENTS.md)
- [x] `::newick{tree="(A:0.1,(B:0.2,C:0.3):0.4);"}` — small phylogenetic tree, rendered as a hand-rolled rectangular cladogram (no vendor lib)

## Also mentioned, not yet tiered/formalized

- [ ] MSA (multiple sequence alignment) viewer — MSAViewer / AlignmentViewer 2
- [ ] Whole-slide/microscopy imaging — OpenSeadragon, for pathology slide deep-zoom. Shape differs from the rest of this list — likely Tier 2/4 since it needs a tile-source URL rather than a short ID.

---

`genome-browser` renders inside a shadow root — confirmed working (unlike `protvista`/`locuszoom`, which need light DOM; see `protvista.ts`/`locuszoom/shared.ts`). IGV.js takes a direct element reference rather than a global document-level lookup, which is the dividing line.

Chem components (SMILES/RDKit, PubChem CID, reaction schemes) are a separate package — see `packages/chem` (not yet started).
