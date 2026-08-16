import { renderMarkdownToHtml } from '@basemark/core';
// Static text import (Bun's `with { type: 'text' }` loader), not a runtime
// `import.meta.resolve` + file read — the latter resolves to a real path on
// disk, which doesn't exist inside `bun build --compile`'s embedded virtual
// filesystem (`/$bunfs/...`). A static import is visible to Bun's bundler at
// build time, so it gets embedded into the compiled binary as a string
// constant, and works identically under plain `bun run` too.
// @ts-expect-error -- no .d.ts for the text-loader import form
import themeCss from '@basemark/core/theme.css' with { type: 'text' };
import { buildRegistry } from './registry';
import { bundleRuntime } from './bundle';

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

// VISION.md's third consumption path: resolve one markdown(+directives) file
// into a single self-contained .html — open it in any browser, no build step
// or framework runtime needed. "Self-contained" means the component runtime
// (bundleRuntime) and theme are inlined, not linked, so the output has no
// external file dependencies.
export async function renderToHtml(source: string): Promise<string> {
	const registry = buildRegistry();
	const bodyHtml = renderMarkdownToHtml(source, registry);
	const runtimeJs = await bundleRuntime();

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(deriveTitle(source))}</title>
<style>${themeCss}</style>
</head>
<body>
${bodyHtml}
<script>${runtimeJs}</script>
</body>
</html>
`;
}
