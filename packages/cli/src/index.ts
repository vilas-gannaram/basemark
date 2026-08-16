#!/usr/bin/env bun
import { parseArgs } from 'node:util';
import { renderToHtml } from './render';

const USAGE = `Usage: basemark render <input.md> [-o <output.html>]`;

async function main(argv: string[]): Promise<void> {
	const [command, ...rest] = argv;

	if (command !== 'render') {
		console.error(USAGE);
		process.exit(1);
	}

	const { values, positionals } = parseArgs({
		args: rest,
		options: { out: { type: 'string', short: 'o' } },
		allowPositionals: true,
	});

	const inputPath = positionals[0];
	if (!inputPath) {
		console.error(USAGE);
		process.exit(1);
	}

	const outputPath = values.out ?? inputPath.replace(/\.mdx?$/, '') + '.html';

	const source = await Bun.file(inputPath).text();
	const html = renderToHtml(source);
	await Bun.write(outputPath, html);

	console.log(`Wrote ${outputPath}`);
}

await main(process.argv.slice(2));
