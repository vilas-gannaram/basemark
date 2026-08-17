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
// resolves, not every domain the CLI knows how to render.
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
<style>${themeCss}</style>${runtimeCss ? `\n<style>${runtimeCss}</style>` : ''}
</head>
<body>
${bodyHtml}
<script>${runtimeJs}</script>
</body>
</html>
`;
}
