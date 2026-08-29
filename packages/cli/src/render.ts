import { parseMarkdown, type ComponentRegistry } from '@basemark/core';
import { toHtml } from 'hast-util-to-html';
import { visit } from 'unist-util-visit';
import type { Element as HastElement, Root as HastRoot } from 'hast';
import { readFileSync } from 'node:fs';
import { buildRegistry } from './registry';

// Read at runtime, relative to this module's own location, rather than
// bundled in as string literals — keeps the bundler-agnostic. Assets are
// copied next to dist/index.js by tsup.config.ts's onSuccess hook, sourced
// from scripts/bundle-runtime.ts's output (run via `pnpm run bundle:runtime`,
// or `pnpm run build`, once after cloning) plus @basemark/core's theme.css.
// base.js is always inlined; the rest only when usedDomains() needs them (bio alone is ~5MB).
function readAsset(relativePath: string): string {
	return readFileSync(new URL(relativePath, import.meta.url), 'utf-8');
}

const themeCss = readAsset('./generated/theme.css');
const baseRuntimeJs = readAsset('./generated/base.global.js');

const DOMAIN_RUNTIME: Record<string, string> = {
	common: readAsset('./generated/common.global.js'),
	bio: readAsset('./generated/bio.global.js'),
	charts: readAsset('./generated/charts.global.js'),
};

const DOMAIN_CSS: Record<string, string> = {
	bio: readAsset('./generated/bio.css'),
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
// Geist font link below is a real network dependency (falls back to theme.css's system stacks).
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
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>${themeCss}</style>${runtimeCss ? `\n<style>${runtimeCss}</style>` : ''}
<style>
	/* See the module comment on this being the one network dependency. */
	html:root {
		--font-sans: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		--font-mono: 'Geist Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
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
<div class="basemark-doc typeset typeset-docs">
${bodyHtml}
</div>
<script>${runtimeJs}</script>
</body>
</html>
`;
}
