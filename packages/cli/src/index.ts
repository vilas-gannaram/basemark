#!/usr/bin/env bun
import { parseArgs } from 'node:util';
import { renderToHtml } from './render';
import { installSkill } from './skill';

const USAGE = `Usage: basemark <command>

Commands:
  render <input.md> [-o <output.html>]      Resolve a markdown(+directives) file to one self-contained HTML file
  skill install [<dir>] [--global]          Install the basemark authoring skill (default: .claude/skills/basemark)
  help                                      Show this message`;

async function main(argv: string[]): Promise<void> {
	const [command, ...rest] = argv;

	if (command === undefined || command === 'help' || command === '--help' || command === '-h') {
		console.log(USAGE);
		return;
	}

	if (command === 'render') {
		await runRender(rest);
	} else if (command === 'skill' && rest[0] === 'install') {
		await runSkillInstall(rest.slice(1));
	} else {
		console.error(`Unknown command: ${command}\n`);
		console.error(USAGE);
		process.exit(1);
	}
}

async function runRender(argv: string[]): Promise<void> {
	const { values, positionals } = parseArgs({
		args: argv,
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
	const html = await renderToHtml(source);
	await Bun.write(outputPath, html);

	console.log(`Wrote ${outputPath}`);
}

async function runSkillInstall(argv: string[]): Promise<void> {
	const { values, positionals } = parseArgs({
		args: argv,
		options: {
			global: { type: 'boolean' },
			target: { type: 'string' },
		},
		allowPositionals: true,
	});

	const installedTo = await installSkill({ global: values.global, target: positionals[0] ?? values.target });
	console.log(`Installed basemark skill to ${installedTo}`);
}

await main(process.argv.slice(2));
