import { parseMarkdown, type ComponentRegistry } from '@basemark/core';
import { toHtml } from 'hast-util-to-html';
import { visit } from 'unist-util-visit';
import type { Element as HastElement, Root as HastRoot } from 'hast';
import { buildRegistry } from './registry';

// Static text import, not runtime `import.meta.resolve` + file read — the
// latter needs a real disk path, which doesn't exist inside `bun build --compile`'s virtual filesystem.
// @ts-expect-error -- no .d.ts for the text-loader import form
import themeCss from '@basemark/core/theme.css' with { type: 'text' };
// Pre-bundled by scripts/bundle-runtime.ts — run `bun run bundle:runtime`
// (or `bun run build`) once after cloning before these resolve to anything real.
// base.runtime.js is always inlined; the rest only when usedDomains() needs them (bio alone is ~5MB).
// @ts-expect-error -- no .d.ts for the text-loader import form
import baseRuntimeJs from './generated/base.runtime.js' with { type: 'text' };
// @ts-expect-error -- no .d.ts for the text-loader import form
import commonRuntimeJs from './generated/common.runtime.js' with { type: 'text' };
// @ts-expect-error -- no .d.ts for the text-loader import form
import bioRuntimeJs from './generated/bio.runtime.js' with { type: 'text' };
// @ts-expect-error -- no .d.ts for the text-loader import form
import chartsRuntimeJs from './generated/charts.runtime.js' with { type: 'text' };
// bio.ts's dynamic locuszoom.css import emits its own output chunk — skip
// inlining it and every locuszoom-* component renders with no styling (a real shipped bug, see bundle-runtime.ts).
// @ts-expect-error -- no .d.ts for the text-loader import form
import bioRuntimeCss from './generated/bio.runtime.css' with { type: 'text' };

const DOMAIN_RUNTIME: Record<string, string> = {
	common: commonRuntimeJs,
	bio: bioRuntimeJs,
	charts: chartsRuntimeJs,
};

const DOMAIN_CSS: Record<string, string> = {
	bio: bioRuntimeCss,
};

// Falls back to the source's first ATX heading, then a fixed default — no need for a full front-matter parser.
function deriveTitle(source: string): string {
	const match = /^#\s+(.+)$/m.exec(source);
	return match ? match[1]!.trim() : 'Basemark document';
}

function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Which domains this document actually needs, not every domain the registry
// knows about — cross-references its resolved tags against tag→domain metadata.
function usedDomains(hast: HastRoot, registry: ComponentRegistry): Set<string> {
	const tagToDomain = new Map<string, string>();
	for (const [, definition] of registry.list()) {
		if ('tag' in definition) tagToDomain.set(definition.tag, definition.domain);
	}

	const domains = new Set<string>();
	visit(hast, 'element', (node: HastElement) => {
		const domain = tagToDomain.get(node.tagName);
		if (domain) domains.add(domain);
	});
	return domains;
}

// VISION.md's third consumption path — one self-contained .html, runtime and
// theme inlined for only the domain(s) this document uses. One exception: the
// Onest font link below is a real network dependency (falls back to theme.css's system stack).
export async function renderToHtml(source: string): Promise<string> {
	const registry = await buildRegistry();
	const hast = parseMarkdown(source, registry);
	const bodyHtml = toHtml(hast);

	const domains = usedDomains(hast, registry);
	const runtimeJs = [baseRuntimeJs, ...[...domains].map((domain) => DOMAIN_RUNTIME[domain])].join('\n');
	const runtimeCss = [...domains]
		.map((domain) => DOMAIN_CSS[domain])
		.filter(Boolean)
		.join('\n');

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(deriveTitle(source))}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${themeCss}</style>${runtimeCss ? `\n<style>${runtimeCss}</style>` : ''}
<style>
	/* Matches examples/vanilla's own override — see the module comment on this being the one network dependency. */
	html:root {
		--font-sans: 'Onest', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	h1, h2, h3, h4, h5, h6 {
		letter-spacing: -0.02em;
	}
	body {
		margin: 0;
		background: var(--background);
		color: var(--foreground);
		font-family: var(--font-sans);
	}
	.basemark-doc {
		max-width: 65rem;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}
</style>
</head>
<body>
<div class="basemark-doc">
${bodyHtml}
</div>
<script>${runtimeJs}</script>
</body>
</html>
`;
}
