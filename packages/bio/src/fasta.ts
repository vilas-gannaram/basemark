import type { ComponentRegistry } from '@basemark/core';

export const FASTA_TAG = 'basemark-fasta';
const RESIDUES_PER_LINE = 60;
const RULER_TICK_EVERY = 10;

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
		overflow-x: auto;
	}
	.label {
		margin: 0 0 0.5rem;
		font-weight: 600;
	}
	.seq {
		white-space: pre;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.8125rem;
		line-height: 1.6;
	}
	.ruler {
		color: var(--muted-foreground);
	}
	.residue {
		border-radius: 2px;
		color: #1a1a1a;
	}
	.hl-run {
		border-radius: 4px;
		box-shadow: 0 0 0 2px var(--primary, #6366f1) inset;
	}
`;

// Property-based amino-acid coloring (4 categories), plus nucleotide coloring —
// not a claim to replicate any specific tool's exact palette.
const NONPOLAR = 'AVLIMFWPG';
const POLAR = 'STCYNQ';
const BASIC = 'KRH';
const ACIDIC = 'DE';
const NUCLEOTIDES = 'ACGTU';

const RESIDUE_COLORS: Record<string, string> = {
	nonpolar: '#ffe08a',
	polar: '#a8e6a1',
	basic: '#a8c8ff',
	acidic: '#ffb3b3',
	other: '#e0e0e0',
	nucA: '#b3e6b3',
	nucC: '#b3d1ff',
	nucG: '#ffe0b3',
	nucT: '#ffb3b3',
};

function isNucleotideSequence(sequence: string): boolean {
	return [...sequence.toUpperCase()].every((char) => NUCLEOTIDES.includes(char) || char === 'N' || char === '-');
}

function residueColor(char: string, nucleotide: boolean): string {
	const upper = char.toUpperCase();
	if (nucleotide) {
		if (upper === 'A') return RESIDUE_COLORS.nucA;
		if (upper === 'C') return RESIDUE_COLORS.nucC;
		if (upper === 'G') return RESIDUE_COLORS.nucG;
		if (upper === 'T' || upper === 'U') return RESIDUE_COLORS.nucT;
		return RESIDUE_COLORS.other;
	}
	if (NONPOLAR.includes(upper)) return RESIDUE_COLORS.nonpolar;
	if (POLAR.includes(upper)) return RESIDUE_COLORS.polar;
	if (BASIC.includes(upper)) return RESIDUE_COLORS.basic;
	if (ACIDIC.includes(upper)) return RESIDUE_COLORS.acidic;
	return RESIDUE_COLORS.other;
}

function escapeHtml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 1-indexed inclusive ranges, e.g. "10-25,40-45".
function parseRanges(raw: string | null): Array<[number, number]> {
	if (!raw) return [];
	return raw
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean)
		.map((part) => {
			const [start, end] = part.split('-').map(Number);
			return [start, end ?? start] as [number, number];
		})
		.filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end));
}

function isHighlighted(position: number, ranges: Array<[number, number]>): boolean {
	return ranges.some(([start, end]) => position >= start && position <= end);
}

function rulerLine(lineStart: number, lineLength: number): string {
	let line = '';
	for (let i = 0; i < lineLength; i++) {
		const position = lineStart + i;
		line += position % RULER_TICK_EVERY === 0 ? String(position).slice(-1) : ' ';
	}
	return line;
}

function residueSpan(char: string, position: number, nucleotide: boolean): string {
	const safeChar = escapeHtml(char);
	const color = residueColor(char, nucleotide);
	return `<span class="residue" style="background:${color}" title="Position ${position}: ${safeChar}">${safeChar}</span>`;
}

// Consecutive same-highlight-state runs, so a pill wrapper spans a whole
// highlighted stretch instead of ringing each residue separately.
function renderLine(line: string, lineStart: number, ranges: Array<[number, number]>, nucleotide: boolean): string {
	let html = '';
	let i = 0;
	while (i < line.length) {
		const startPos = lineStart + i;
		const highlighted = isHighlighted(startPos, ranges);
		let run = '';
		while (i < line.length && isHighlighted(lineStart + i, ranges) === highlighted) {
			run += residueSpan(line[i], lineStart + i, nucleotide);
			i++;
		}
		html += highlighted ? `<span class="hl-run">${run}</span>` : run;
	}
	return html;
}

function renderSequence(sequence: string, ranges: Array<[number, number]>): string {
	const nucleotide = isNucleotideSequence(sequence);
	let html = '';
	for (let lineStart = 1; lineStart <= sequence.length; lineStart += RESIDUES_PER_LINE) {
		const line = sequence.slice(lineStart - 1, lineStart - 1 + RESIDUES_PER_LINE);
		html += `<span class="ruler">${rulerLine(lineStart, line.length)}</span>\n`;
		html += renderLine(line, lineStart, ranges, nucleotide);
		html += '\n\n';
	}
	return html;
}

// Leaf directive, not a fence — Basemark's authoring syntax is remark-directive
// throughout, including Tier 3 inline-literal content (ARCH §3).
export async function registerFasta(registry: ComponentRegistry): Promise<void> {
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		class FastaElement extends HTMLElement {
			static get observedAttributes(): string[] {
				return ['sequence', 'id', 'highlight'];
			}

			constructor() {
				super();
				this.attachShadow({ mode: 'open' });
			}

			connectedCallback(): void {
				this.render();
			}

			attributeChangedCallback(): void {
				if (this.isConnected) this.render();
			}

			private render(): void {
				const sequence = (this.getAttribute('sequence') ?? '').replace(/\s+/g, '');
				if (!sequence) return;
				const id = this.getAttribute('id');
				const ranges = parseRanges(this.getAttribute('highlight'));

				const root = this.shadowRoot as ShadowRoot;
				root.innerHTML = `
					<style>${STYLES}</style>
					${id ? `<p class="label">&gt;${escapeHtml(id)}</p>` : ''}
					<div class="seq">${renderSequence(sequence, ranges)}</div>
				`;
			}
		}

		if (!customElements.get(FASTA_TAG)) {
			customElements.define(FASTA_TAG, FastaElement);
		}
	}

	registry.register('fasta', {
		tag: FASTA_TAG,
		domain: 'bio',
		title: 'FASTA Sequence Viewer',
		description:
			'Renders a nucleotide/protein sequence with a position ruler, wrapped for readability, per-residue ' +
			'color coding (by base for nucleotide sequences, by side-chain property for protein), and optional ' +
			'residue-range highlighting. Use this for a short inline sequence the author is providing directly, not ' +
			'one fetched from an accession (see protvista for UniProt-backed sequence tracks).',
		schema: {
			sequence: {
				type: 'string',
				required: true,
				description: 'The raw sequence (nucleotide or protein), whitespace is ignored.',
			},
			id: {
				type: 'string',
				description: 'Optional sequence label, rendered as a ">id" header.',
			},
			highlight: {
				type: 'string',
				description: 'Comma-separated 1-indexed residue ranges to highlight, e.g. "10-25,40-45".',
			},
		},
	});
}
