# Welcome to the genotyping core

You're the newest hire in the lab that ran every variant and locus on the Bio page — this is the onboarding page that new sequencing-core hires actually get pointed at on day one. It's rendered here through `MarkdownRenderer` from `@basemark/react`, every component below resolving to a real React component via the generic `@lit/react` wrapper — but nothing on this page is bio-specific; it's `@basemark/common`, so the exact same markdown renders identically in `examples/vanilla` with no framework at all.

:::alert{title="Before you touch a pipette"}
Read the biosafety section below in full — every sample on this bench is treated as potentially infectious until proven otherwise.
:::

## Your first week

Three things need to happen before you're let near a real sample: a badge upgrade in the LIMS from :badge[Trainee]{variant="outline"} to :badge[Qualified]{variant="secondary"}, a signed SOP acknowledgment, and a bench walkthrough with your mentor. Most of that starts with a click: :button[Request LIMS access]{} :button[Book a bench walkthrough]{variant="secondary"} :button[Read the SOPs]{variant="outline" href="https://ui.shadcn.com"}. Destructive actions — like :button[Deactivate my badge]{variant="destructive" size="sm"} at offboarding — stay red and rare, and a quieter :button[Skip for now]{variant="ghost" size="sm"} or :button[full details]{variant="link"} sit next to the ones that matter less.

::separator{}

## Bench equipment you'll actually touch

Every instrument gets its own qualification badge once you've been signed off on it — check the LIMS before you run anything marked anything other than :badge[Stable]{variant="secondary"}.

| Instrument | Used for | Status |
| --- | --- | --- |
| Spin-column extractor | Genomic DNA prep from whole blood | `stable` |
| qPCR thermocycler | Library quantification | `stable` |
| NovaSeq sequencer | Short-read sequencing | `stable` |
| Nanopore MinION | Long-read runs, pilot studies only | `experimental` |

:::alert{variant="destructive" title="Biosafety"}
Whole blood and any downstream extract are BSL-2 until your mentor confirms otherwise — gloves and eye protection at the bench, no exceptions, no matter how routine the sample looks.
:::

## Questions everyone asks in week one

::::accordion
:::accordion-item{label="Why does the LIMS badge system exist?"}
So anyone walking past a bench can tell at a glance who's cleared to run what — a `stable` badge on an instrument means any qualified tech can use it unsupervised; `experimental` means ask first.
:::

:::accordion-item{label="What if I contaminate a sample?"}
Say so immediately — a flagged, re-run sample costs an afternoon; a contaminated result that ships costs a retraction. Nobody has ever been in trouble here for raising their hand early.
:::

:::accordion-item{label="Where do I find the extraction protocol?"}
Pinned in the shared drive under Protocols, and referenced from every genotyping run's LIMS entry — the spin-column extraction is the same one you'll be trained on this week.
:::
::::

## The tour

::::carousel
:::card{title="Extraction bench"}
Where every sample's day starts — spin-column DNA extraction from whole blood, the protocol you'll be trained on first.
:::

:::card{title="Sequencing floor"}
The NovaSeq and MinION live here, behind the badge-access door past the extraction bench.
:::

:::card{title="Sample archive"}
Every extracted sample gets a barcode and a freezer slot here before it goes anywhere near a sequencer.
:::
::::

A few real photos of a working bench, so you know what to expect before your first day — carousel and image both compose the same way, since a carousel slide is just another direct child block:

::::carousel
![Lab microscope](https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80)

![Pipetting samples](https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&q=80)

![Petri dishes](https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&q=80)
::::

## One thing that trips people up

:::popover{trigger="Why is the freezer log a spreadsheet, not the LIMS?" side="bottom"}
Historical reasons — it predates the LIMS by a decade and migrating it is a standing to-do. Ask your mentor where the current copy lives; there's always exactly one that's authoritative.
:::

## Orientation media

The mandatory safety video, and the lab's own onboarding podcast episode — both just a share URL, provider and embed ID detected automatically:

::video{url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"}

::audio{url="https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC"}

::audio{url="https://soundcloud.com/forss/flickermood"}

## The script that sets up your dev laptop

If you're on the bioinformatics side rather than at the bench, this is the same registration snippet every pipeline script in this lab starts with — fenced code blocks get syntax highlighting via `rehype-highlight`, wired into `@basemark/core`'s parse pipeline:

```ts
import { createRegistry } from '@basemark/core';
import { registerCommonComponents } from '@basemark/common';

const registry = createRegistry();
registerCommonComponents(registry);
```

## Appendix: failing visibly

Basemark's other job is to fail loudly, not silently, when a directive is wrong — the same guarantee applies to whatever a future LIMS-integration directive on this page would do. An unknown directive:

::not-a-real-component{foo="bar"}

And a container missing its closing fence — everything below gets captured inside it instead of rendering separately, and the error banner shows exactly what was swallowed:

:::card{title="Unclosed"}
This text is inside the broken card.

## This heading got swallowed too

So did this paragraph.
