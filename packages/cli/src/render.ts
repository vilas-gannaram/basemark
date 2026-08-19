import { parseMarkdown, type ComponentRegistry } from '@basemark/core';
import { toHtml } from 'hast-util-to-html';
import { visit } from 'unist-util-visit';
import type { Element as HastElement, Root as HastRoot } from 'hast';
import { buildRegistry } from './registry';

// Static text import (Bun's `with { type: 'text' }` loader), not a runtime
// `import.meta.resolve` + file read — the latter resolves to a real path on
// disk, which doesn't exist inside `bun build --compile`'s embedded virtual
// filesystem (`/$bunfs/...`). A static import is visible to Bun's bundler at
// build time, so it gets embedded into the compiled binary as a string
// constant, and works identically under plain `bun run` too.
// @ts-expect-error -- no .d.ts for the text-loader import form
import themeCss from '@basemark/core/theme.css' with { type: 'text' };
// Pre-bundled by scripts/bundle-runtime.ts, not bundled here at render time —
// see that script's comment for why. base.runtime.js is always inlined (see
// its own comment); common.runtime.js/bio.runtime.js are inlined only when
// usedDomains() below says this particular document actually needs them —
// bio.runtime.js alone is ~5MB (3Dmol.js/protvista-uniprot/locuszoom), so a
// common-only document skipping it is the whole point of this split. Run
// `bun run bundle:runtime` once after cloning (or `bun run build`, which does
// it for you) before these imports resolve to anything real.
// @ts-expect-error -- no .d.ts for the text-loader import form
import baseRuntimeJs from './generated/base.runtime.js' with { type: 'text' };
// @ts-expect-error -- no .d.ts for the text-loader import form
import commonRuntimeJs from './generated/common.runtime.js' with { type: 'text' };
// @ts-expect-error -- no .d.ts for the text-loader import form
import bioRuntimeJs from './generated/bio.runtime.js' with { type: 'text' };
// @ts-expect-error -- no .d.ts for the text-loader import form
import chartsRuntimeJs from './generated/charts.runtime.js' with { type: 'text' };
// bio.ts's `await import('locuszoom/dist/locuszoom.css')` makes Bun's
// bundler emit LocusZoom's real stylesheet as its own output chunk, separate
// from bio.runtime.js — without inlining it too, every locuszoom-* component
// mounts and resolves but renders with no toolbar/panel styling at all (a
// real bug this repo shipped once: only outputs[0] was written, silently
// dropping this file — see bundle-runtime.ts's comment). base.ts/common.ts
// have no CSS counterpart (no real .css import in either).
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

// Falls back to the source's first ATX heading (`# Title`), then a fixed
// default — markdown has no dedicated title field, and this only needs to
// be good enough for a browser tab, not a full front-matter parser.
function deriveTitle(source: string): string {
	const match = /^#\s+(.+)$/m.exec(source);
	return match ? match[1]!.trim() : 'Basemark document';
}

function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Which of DOMAIN_RUNTIME's keys this specific document actually needs, by
// cross-referencing the tag names present in its resolved hast tree against
// the registry's tag→domain metadata — not "every domain the registry knows
// about", which would defeat the point of splitting the bundles in the
// first place (see bundle-runtime.ts's comment).
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

// VISION.md's third consumption path: resolve one markdown(+directives) file
// into a single self-contained .html — open it in any browser, no build step
// or framework runtime needed. "Self-contained" means the component runtime
// and theme are inlined, not linked, so the output has no external file
// dependencies — but only for the domain(s) this specific document actually
// resolves, not every domain the CLI knows how to render. One deliberate
// exception: the Onest Google Font link below is a real network dependency
// (falls back to theme.css's system-font stack if that request fails) —
// matches examples/vanilla/examples/react's own look rather than embedding a
// base64 font file into every single output.
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
	/* Matches examples/vanilla/examples/react's own override — this is a
	 * network dependency (fonts.googleapis.com), which means the output isn't
	 * fully self-contained/offline-safe the way the rest of this file's markup
	 * and scripts are; the font link above is the one deliberate exception.
	 * Falls back to theme.css's system-font stack if that request fails. */
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
