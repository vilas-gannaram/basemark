import process from 'node:process';
import { defineConfig } from 'astro/config';

// GitHub Pages project-site path — must match the repo name's exact casing.
// No integrations needed: content renders to plain HTML via
// @basemark/core's renderMarkdownToHtml() in each page's frontmatter, and
// the resolved custom-element tags upgrade client-side via
// src/client/register.ts. No React/MDX — see the plan's "why Astro" note.
//
// base only applies to 'build'/'preview' (which serve dist, matching GitHub
// Pages' real /Basemark/ path) — not 'dev', which otherwise 404s on every
// URL that doesn't start with /Basemark/, including plain localhost:4321/.
// Astro's defineConfig() (unlike Vite's) doesn't accept a function — it's a
// plain identity helper (see astro/dist/config/index.js) — so the running
// subcommand has to be read off argv instead, the same place Astro's own
// CLI reads it (astro dev / astro build / astro preview).
const isDev = process.argv.includes('dev');

export default defineConfig({
	site: 'https://vilas-gannaram.github.io',
	base: isDev ? '/' : '/basemark',
});
