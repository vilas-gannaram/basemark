A component never makes you supply a data blob if a short identifier is enough for it to fetch or derive the rest itself. That rule produces five tiers — pick the lowest one a component actually offers.

| Tier | You write | The component does |
|---|---|---|
| 0 — zero config | nothing but a URL/DOI | auto-detect + fetch |
| 1 — single ID | one accession/identifier | fetch + parse + render |
| 2 — composite key | 2–4 short fields | fetch + parse + render |
| 3 — inline literal | the actual short content | parse + render, no fetch |
| 4 — full data/URL | a structured blob | render only — an escape hatch, not the default |

## Tier 1 — one identifier

A single PDB ID is enough; the component fetches and parses the structure itself:

::structure{pdbid="1CRN"}

That's `::structure{pdbid="1CRN"}` — no structure file, no coordinates, just the ID.

## Tier 2 — a few short fields

A genomic region — chromosome, start, end — not a blob of association data:

::locuszoom-assoc{chrom="10" start="114550452" end="115067678"}

That's `::locuszoom-assoc{chrom="10" start="114550452" end="115067678"}` — the component fetches and plots the association data itself.

## Tier 3 — inline, no fetch

Small enough to write directly — a bar chart from numbers you already have, no file to host:

::bar-chart{labels="Mon,Tue,Wed" values="4,7,3" title="Example"}

That chart above is `::bar-chart{labels="Mon,Tue,Wed" values="4,7,3" title="Example"}` — no `data` URL, just the numbers.

## Tier 4 — full data

An escape hatch, not a default. If you're reaching for a component that only accepts a structured blob or a hosted-file URL, check whether a lower-tier form exists first — most components in this catalog don't offer Tier 4 at all, by design.
