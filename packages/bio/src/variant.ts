import type { ComponentRegistry } from '@basemark/core';

export const VARIANT_TAG = 'basemark-variant';
// A well-studied pathogenic variant can carry dozens of near-duplicate ClinVar
// condition names — capped so one variant's card doesn't dwarf its neighbors.
const MAX_CONDITIONS_SHOWN = 4;

// MyVariant.info's own query API — a fixed, well-known host (CORS-open,
// no API key), not a caller-supplied URL, same reasoning as pathway.ts's
// KEGG endpoint and interaction-network.ts's STRING endpoint.
const MYVARIANT_QUERY_BASE = 'https://myvariant.info/v1/query';
const FIELDS = [
	'clinvar.rcv.clinical_significance',
	'clinvar.rcv.conditions.name',
	'clinvar.gene.symbol',
	'clinvar.hg38.start',
	'dbsnp.chrom',
	'dbsnp.ref',
	'dbsnp.alt',
	'dbsnp.hg19.start',
	'cadd.phred',
].join(',');

const STYLES = `
	:host {
		display: block;
		box-sizing: border-box;
		margin: 1.5rem 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.75rem;
		background: var(--card);
		color: var(--card-foreground);
		font-family: var(--font-sans);
	}
	.title {
		margin: 0 0 0.5rem;
		font-weight: 600;
	}
	.status {
		color: var(--muted-foreground);
		font-size: 0.875rem;
	}
	.error {
		color: var(--destructive, #dc2626);
		font-size: 0.875rem;
	}
	dl {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.375rem 0.75rem;
		margin: 0;
		font-size: 0.875rem;
	}
	dt {
		color: var(--muted-foreground);
	}
	dd {
		margin: 0;
	}
	.badge {
		display: inline-block;
		white-space: nowrap;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: white;
	}
`;

function toArray<T>(value: T | T[] | undefined): T[] {
	if (value == null) return [];
	return Array.isArray(value) ? value : [value];
}

// Loosely keyed on ClinVar's controlled vocabulary — most-severe match wins.
function significanceColor(significance: string): string {
	const lower = significance.toLowerCase();
	if (lower.includes('pathogenic') && !lower.includes('likely')) return '#dc2626';
	if (lower.includes('likely pathogenic')) return '#ea580c';
	if (lower.includes('risk')) return '#ea580c';
	if (lower.includes('conflicting') || lower.includes('uncertain')) return '#6b7280';
	if (lower.includes('likely benign')) return '#65a30d';
	if (lower.includes('benign')) return '#16a34a';
	return '#6b7280';
}

function escapeHtml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderCard(rsid: string, hit: IVariantHit, title: string | null): string {
	const gene = hit.clinvar?.gene?.symbol;
	const chrom = hit.dbsnp?.chrom;
	const ref = hit.dbsnp?.ref;
	const alt = hit.dbsnp?.alt;
	const cadd = hit.cadd?.phred;

	// dbsnp only carries hg19 coordinates; hg38 is only present when there's
	// a ClinVar record. Prefer hg38 when available, fall back to hg19 labeled.
	const position = hit.clinvar?.hg38?.start
		? { build: 'hg38', start: hit.clinvar.hg38.start }
		: hit.dbsnp?.hg19?.start
			? { build: 'hg19', start: hit.dbsnp.hg19.start }
			: null;

	const rcvEntries = toArray(hit.clinvar?.rcv);
	const significances = [...new Set(rcvEntries.map((rcv) => rcv.clinical_significance).filter((v): v is string => Boolean(v)))];
	const conditions = [
		...new Set(
			rcvEntries.flatMap((rcv) => toArray(rcv.conditions).map((condition) => condition.name)).filter((v): v is string => Boolean(v)),
		),
	];

	const rows: string[] = [];
	if (gene) rows.push(`<dt>Gene</dt><dd>${escapeHtml(gene)}</dd>`);
	if (chrom && position) rows.push(`<dt>Position (${position.build})</dt><dd>chr${escapeHtml(chrom)}:${position.start}</dd>`);
	if (ref && alt) rows.push(`<dt>Allele</dt><dd>${escapeHtml(ref)} &rarr; ${escapeHtml(alt)}</dd>`);
	if (significances.length > 0) {
		const badges = significances
			.map((sig) => `<span class="badge" style="background:${significanceColor(sig)}">${escapeHtml(sig)}</span>`)
			.join(' ');
		rows.push(`<dt>ClinVar</dt><dd>${badges}</dd>`);
	}
	if (conditions.length > 0) {
		const shown = conditions.slice(0, MAX_CONDITIONS_SHOWN);
		const remaining = conditions.length - shown.length;
		const suffix = remaining > 0 ? ` (+${remaining} more)` : '';
		rows.push(`<dt>Conditions</dt><dd>${escapeHtml(shown.join(', '))}${suffix}</dd>`);
	}
	if (typeof cadd === 'number') rows.push(`<dt>CADD (deleteriousness)</dt><dd>${cadd.toFixed(1)}</dd>`);

	return `
		<style>${STYLES}</style>
		${title ? `<p class="title">${escapeHtml(title)}</p>` : ''}
		<dl>${rows.length > 0 ? rows.join('') : `<dt>rsID</dt><dd>${escapeHtml(rsid)} (no annotation found)</dd>`}</dl>
	`;
}

// Leaf directive — Tier 1, single ID, fetch+parse+render (ARCH §2).
export async function registerVariant(registry: ComponentRegistry): Promise<void> {
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		class VariantElement extends HTMLElement {
			static get observedAttributes(): string[] {
				return ['rsid', 'title'];
			}

			// rsid + title can each trigger their own async render() call —
			// only the most recent one's fetch result is allowed to apply.
			private renderToken = 0;

			connectedCallback(): void {
				void this.render();
			}

			attributeChangedCallback(): void {
				if (this.isConnected) void this.render();
			}

			private async render(): Promise<void> {
				const rsid = this.getAttribute('rsid');
				if (!rsid) return;
				const title = this.getAttribute('title');
				const token = ++this.renderToken;

				if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
				const root = this.shadowRoot as ShadowRoot;
				root.innerHTML = `<style>${STYLES}</style><p class="status">Loading ${escapeHtml(rsid)}&hellip;</p>`;

				try {
					const url = `${MYVARIANT_QUERY_BASE}?q=${encodeURIComponent(`dbsnp.rsid:${rsid}`)}&fields=${FIELDS}`;
					const response = await fetch(url);
					if (!response.ok) throw new Error(`HTTP ${response.status}`);
					const data = (await response.json()) as { hits?: IVariantHit[] };
					const hit = data.hits?.[0];
					if (!hit) throw new Error('not found');
					if (token !== this.renderToken) return;
					root.innerHTML = renderCard(rsid, hit, title);
				} catch {
					if (token !== this.renderToken) return;
					root.innerHTML = `
						<style>${STYLES}</style>
						${title ? `<p class="title">${escapeHtml(title)}</p>` : ''}
						<p class="error">Could not load variant data for "${escapeHtml(rsid)}" — check the rsID.</p>
					`;
				}
			}
		}

		if (!customElements.get(VARIANT_TAG)) {
			customElements.define(VARIANT_TAG, VariantElement);
		}
	}

	registry.register('variant', {
		tag: VARIANT_TAG,
		domain: 'bio',
		title: 'Variant Card (ClinVar/dbSNP)',
		description:
			'Renders a card of ClinVar/dbSNP annotation for a single variant, given its rsID — gene, hg38 position, ' +
			'allele, ClinVar clinical significance, associated conditions, and a CADD deleteriousness score where ' +
			"available. Use this for a single variant's own annotation, not a locus-wide association plot (see the " +
			'locuszoom-* components) or a phenome-wide scan (see locuszoom-phewas).',
		schema: {
			rsid: {
				type: 'string',
				required: true,
				description: 'A dbSNP rsID, e.g. "rs7903146".',
			},
			title: {
				type: 'string',
				description: 'Optional title rendered above the card.',
			},
		},
	});
}

interface IRcvEntry {
	clinical_significance?: string;
	conditions?: { name?: string } | Array<{ name?: string }>;
}

interface IVariantHit {
	clinvar?: { rcv?: IRcvEntry | IRcvEntry[]; gene?: { symbol?: string }; hg38?: { start?: number } };
	dbsnp?: { chrom?: string; ref?: string; alt?: string; hg19?: { start?: number } };
	cadd?: { phred?: number };
}
