import type { ComponentRegistry } from '@basemark/core';

export const NEWICK_TAG = 'basemark-newick';
const ROW_HEIGHT_PX = 24;
const LABEL_WIDTH_PX = 140;
const TREE_WIDTH_PX = 360;
const PADDING_PX = 12;

// Minimal recursive-descent Newick parser — (A:0.1,(B:0.2,C:0.3):0.4);
function parseNewick(source: string): ITreeNode {
	const trimmed = source.trim().replace(/;\s*$/, '');
	let pos = 0;

	function parseNode(): ITreeNode {
		let children: ITreeNode[] = [];
		if (trimmed[pos] === '(') {
			pos++;
			children = [parseNode()];
			while (trimmed[pos] === ',') {
				pos++;
				children.push(parseNode());
			}
			if (trimmed[pos] === ')') pos++;
		}

		let name = '';
		while (pos < trimmed.length && !',()[:]'.includes(trimmed[pos])) {
			name += trimmed[pos];
			pos++;
		}

		let length = 0;
		if (trimmed[pos] === ':') {
			pos++;
			let numStr = '';
			while (pos < trimmed.length && !',()'.includes(trimmed[pos])) {
				numStr += trimmed[pos];
				pos++;
			}
			length = Number(numStr) || 0;
		}

		return { name: name.trim(), length, children };
	}

	return parseNode();
}

// Rectangular cladogram: x from cumulative branch length, y from leaf order.
function layout(node: ITreeNode): { root: ILaidOutNode; leafCount: number } {
	let nextLeafY = 0;

	function place(n: ITreeNode, x: number): ILaidOutNode {
		if (n.children.length === 0) {
			const y = nextLeafY;
			nextLeafY++;
			return { ...n, x, y, children: [] };
		}
		const laidOutChildren = n.children.map((child) => place(child, x + (child.length || 1)));
		const y = laidOutChildren.reduce((sum, c) => sum + c.y, 0) / laidOutChildren.length;
		return { ...n, x, y, children: laidOutChildren };
	}

	const root = place(node, 0);
	return { root, leafCount: nextLeafY };
}

function maxX(node: ILaidOutNode): number {
	return node.children.length === 0 ? node.x : Math.max(node.x, ...node.children.map(maxX));
}

function renderEdges(node: ILaidOutNode, scaleX: number): string {
	let svg = '';
	for (const child of node.children) {
		const x0 = node.x * scaleX;
		const x1 = child.x * scaleX;
		const y0 = node.y * ROW_HEIGHT_PX + ROW_HEIGHT_PX / 2;
		const y1 = child.y * ROW_HEIGHT_PX + ROW_HEIGHT_PX / 2;
		// Elbow connector: horizontal from parent, vertical to child's row, horizontal into child.
		svg += `<path d="M${x0},${y0} V${y1} H${x1}" fill="none" stroke="var(--border)" stroke-width="1.5" />`;
		svg += renderEdges(child, scaleX);
	}
	return svg;
}

function renderLabels(node: ILaidOutNode, scaleX: number): string {
	let svg = '';
	if (node.children.length === 0 && node.name) {
		const x = node.x * scaleX + 6;
		const y = node.y * ROW_HEIGHT_PX + ROW_HEIGHT_PX / 2;
		svg += `<text x="${x}" y="${y}" dominant-baseline="middle" fill="var(--card-foreground)" font-size="0.8125rem">${escapeXml(node.name)}</text>`;
	}
	for (const child of node.children) svg += renderLabels(child, scaleX);
	return svg;
}

function escapeXml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

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
	.title {
		margin: 0 0 0.5rem;
		font-weight: 600;
	}
`;

// Leaf directive, not a fence — same reasoning as fasta.ts.
export async function registerNewick(registry: ComponentRegistry): Promise<void> {
	if (typeof HTMLElement !== 'undefined' && typeof customElements !== 'undefined') {
		class NewickElement extends HTMLElement {
			static get observedAttributes(): string[] {
				return ['tree', 'title'];
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
				const source = this.getAttribute('tree');
				if (!source) return;
				const title = this.getAttribute('title');

				const parsed = parseNewick(source);
				const { root, leafCount } = layout(parsed);
				const treeMaxX = maxX(root) || 1;
				const scaleX = TREE_WIDTH_PX / treeMaxX;
				const width = TREE_WIDTH_PX + LABEL_WIDTH_PX + PADDING_PX * 2;
				const height = Math.max(leafCount, 1) * ROW_HEIGHT_PX + PADDING_PX * 2;

				const root_ = this.shadowRoot as ShadowRoot;
				root_.innerHTML = `
					<style>${STYLES}</style>
					${title ? `<p class="title">${escapeXml(title)}</p>` : ''}
					<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
						<g transform="translate(${PADDING_PX}, ${PADDING_PX})">
							${renderEdges(root, scaleX)}
							${renderLabels(root, scaleX)}
						</g>
					</svg>
				`;
			}
		}

		if (!customElements.get(NEWICK_TAG)) {
			customElements.define(NEWICK_TAG, NewickElement);
		}
	}

	registry.register('newick', {
		tag: NEWICK_TAG,
		domain: 'bio',
		title: 'Phylogenetic Tree Viewer (Newick)',
		description:
			'Renders a small phylogenetic tree from Newick-format text as a rectangular cladogram. Use this for an ' +
			'author-provided tree topology, not a fetched one — there is no accession-based tree source yet.',
		schema: {
			tree: {
				type: 'string',
				required: true,
				description: 'Newick-format tree string, e.g. "(A:0.1,(B:0.2,C:0.3):0.4);".',
			},
			title: {
				type: 'string',
				description: 'Optional title rendered above the tree.',
			},
		},
	});
}

interface ITreeNode {
	name: string;
	length: number;
	children: ITreeNode[];
}

interface ILaidOutNode extends ITreeNode {
	x: number;
	y: number;
	children: ILaidOutNode[];
}
