import { useState, type ReactElement, type ReactNode } from 'react';

export interface GeneChipProps {
	full?: string;
	chrom?: string;
	children?: ReactNode;
}

// App-local only (ARCHITECTURE.md §6's native registration escape hatch)
// — a real React component with its own state, registered as `type: 'react'`
// instead of a customElements tag. There's nothing here a Web Component
// couldn't also do; the point is proving the escape hatch itself works, for a
// component an app author already has React context/state for and doesn't
// want to round-trip through a custom element to use.
export function GeneChip({ full, chrom, children }: GeneChipProps): ReactElement {
	const [expanded, setExpanded] = useState(false);

	return (
		<span style={{ display: 'inline-block' }}>
			<button
				type="button"
				onClick={() => setExpanded((value) => !value)}
				aria-expanded={expanded}
				style={{
					font: 'inherit',
					fontStyle: 'italic',
					fontWeight: 600,
					cursor: 'pointer',
					border: '1px solid var(--border)',
					borderRadius: '999px',
					padding: '0.05rem 0.55rem',
					background: expanded ? 'var(--muted)' : 'var(--secondary)',
					color: 'var(--secondary-foreground)',
				}}
			>
				{children}
			</button>
			{expanded && (
				<span style={{ marginLeft: '0.4rem', color: 'var(--muted-foreground)', fontSize: '0.9em' }}>
					{full}
					{chrom ? ` · chr${chrom}` : ''}
				</span>
			)}
		</span>
	);
}
