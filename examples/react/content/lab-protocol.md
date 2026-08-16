# Protocol: Genomic DNA Extraction from Whole Blood

Every genotype behind the association plots on the GWAS variant report page starts here — you can't call rs7903146's genotype in a sample until you've pulled clean genomic DNA out of it. This is a standard spin-column extraction from EDTA whole blood, the same shape of protocol a genotyping core runs before samples ever reach a GWAS pipeline.

:::alert{variant="destructive" title="Biosafety"}
Treat all blood samples as potentially infectious. Gloves and eye protection required at all times; work at an open bench with a spill kit within reach. Dispose of all tips, tubes, and lysate-contaminated material in a biohazard sharps/waste container, not general trash.
:::

:::card{title="Overview"}
Spin-column extraction of genomic DNA from fresh or frozen EDTA-anticoagulated whole blood, using silica-membrane binding under chaotropic salt conditions.

Status: :badge[BSL-2]{variant="destructive"} :badge[~45 min]{variant="secondary"} :badge[Spin-column]{variant="outline"} :badge[Validated]{}
:::

## Reagents & equipment

| Item | Amount per sample | Notes |
| --- | --- | --- |
| Whole blood (EDTA) | 200 µL | Fresh or frozen, not heparinized |
| Lysis buffer (Proteinase K + chaotropic salt) | 220 µL | Bring to room temp before use |
| Proteinase K | 20 µL | Keep on ice; do not vortex |
| Wash buffer 1 (ethanol-based) | 500 µL | |
| Wash buffer 2 (ethanol-based) | 500 µL | |
| Elution buffer (low-salt, pH 8.0) | 100–200 µL | Pre-warm to 56 °C for higher yield |
| Spin column + collection tubes | 1 set | |
| Microcentrifuge (≥20,000 × g) | — | |
| Heat block or water bath | — | 56 °C |

## Procedure

:::::accordion
::::accordion-item{label="1. Lysis"}
Combine 200 µL whole blood, 20 µL Proteinase K, and 220 µL Lysis buffer in a 1.5 mL tube. Vortex 15 s, then incubate at 56 °C for 10 min.

:::popover{trigger="Why 56 °C?" side="right"}
Proteinase K's activity peaks around 55–60 °C — high enough to fully digest cellular and nuclear proteins fast, but well below the temperature that would start denaturing the genomic DNA itself.
:::
::::

:::accordion-item{label="2. Binding"}
Add 220 µL ethanol (96–100%) to the lysate, vortex 15 s. Transfer the entire mixture to a spin column and centrifuge at 8,000 rpm for 1 min. Discard the flow-through.
:::

:::accordion-item{label="3. Wash I"}
Add 500 µL Wash buffer 1 to the column. Centrifuge at 8,000 rpm for 1 min. Discard the flow-through and reuse the collection tube.
:::

:::accordion-item{label="4. Wash II"}
Add 500 µL Wash buffer 2. Centrifuge at full speed (≥20,000 × g) for 3 min to dry the membrane completely — residual ethanol here is the single most common cause of downstream PCR/genotyping inhibition.
:::

:::accordion-item{label="5. Elution"}
Transfer the column to a clean 1.5 mL tube. Add 100–200 µL pre-warmed Elution buffer directly to the membrane center, incubate 1 min at room temperature, then centrifuge at 8,000 rpm for 1 min. The flow-through is your genomic DNA.
:::
:::::

## Expected outcomes

::::carousel
:::card{title="Good extraction"}
260/280 ratio 1.7–1.9, 260/230 ratio ≥1.8, yield 4–8 µg from 200 µL blood. Proceed straight to genotyping/library prep.
:::

:::card{title="Low yield"}
Usually an under-volume or partially clotted starting sample, or a degraded Proteinase K stock. Re-extract from a fresh aliquot if available.
:::

:::card{title="Degraded / sheared DNA"}
Visible smearing on a gel below the high-molecular-weight band, usually from excess vortexing after lysis or a freeze-thaw cycle. Mix by gentle inversion, not vortexing, after the lysis step.
:::
::::

---

:button[Mark step complete]{} :button[Export result to LIMS]{variant="outline"} :button[Flag a deviation]{variant="destructive"}
