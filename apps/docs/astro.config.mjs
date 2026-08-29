import process from 'node:process';
import { defineConfig } from 'astro/config';

// `base` only applies to 'build'/'preview' (matching GitHub Pages' real
// /basemark/ path) — not 'dev', which otherwise 404s on plain localhost:4321.
// defineConfig() takes no function, so read the subcommand off argv instead.
const isDev = process.argv.includes('dev');

export default defineConfig({
	site: 'https://vilas-gannaram.github.io',
	base: isDev ? '/' : '/basemark',
});
