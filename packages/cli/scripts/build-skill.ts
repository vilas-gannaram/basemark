// Generates the skill content `skill.ts` embeds into the compiled binary.
// Written as one JSON blob rather than one file per component: a bundled
// bin needs static imports (render.ts's runtime bundles hit this same
// constraint), and a component-per-import would mean editing this script's
// import list every time a component is added/removed. One
// `import skillContent from './generated/skill-content.json'` stays valid
// regardless of what the registry currently holds.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { generateSystemPrompt, describeComponent } from '@basemark/core';
import { buildRegistry } from '../src/registry.ts';

const registry = await buildRegistry();

const templatePath = new URL('../src/skill-template.md', import.meta.url);
const template = await readFile(templatePath, 'utf-8');
const skillMd = template.replace('{{INDEX}}', generateSystemPrompt(registry));

const references: Record<string, string> = {};
for (const [name] of registry.list()) {
	references[name] = describeComponent(registry, name);
}

const outputPath = new URL('../src/generated/skill-content.json', import.meta.url);
await mkdir(new URL('../src/generated/', import.meta.url), { recursive: true });
await writeFile(outputPath, JSON.stringify({ skillMd, references } satisfies ISkillContent, null, 2));
console.log(`Wrote ${outputPath.pathname}`);

interface ISkillContent {
	skillMd: string;
	references: Record<string, string>;
}
