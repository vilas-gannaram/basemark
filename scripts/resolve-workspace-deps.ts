// @changesets/cli's publish command only rewrites `workspace:*` ranges for
// pnpm/yarn (each has its own publish tool that does it) — anything else,
// Bun included, falls through to plain `npm publish` with zero rewriting,
// shipping the literal string and breaking `npm install` for consumers.
// Run this before `changeset publish`, then `git checkout` the touched
// package.jsons after — workspace:* is what local dev wants back.
import { readdir } from 'node:fs/promises';

const packagesDir = new URL('../packages/', import.meta.url);
const dirs = (await readdir(packagesDir, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name);

const versions = new Map<string, string>();
for (const dir of dirs) {
	const pkg = await Bun.file(new URL(`${dir}/package.json`, packagesDir)).json();
	versions.set(pkg.name, pkg.version);
}

for (const dir of dirs) {
	const pkgPath = new URL(`${dir}/package.json`, packagesDir);
	const pkg = await Bun.file(pkgPath).json();
	let changed = false;

	for (const field of ['dependencies', 'devDependencies'] as const) {
		const deps = pkg[field];
		if (!deps) continue;
		for (const [name, range] of Object.entries(deps)) {
			if (typeof range === 'string' && range.startsWith('workspace:') && versions.has(name)) {
				deps[name] = versions.get(name);
				changed = true;
			}
		}
	}

	if (changed) {
		await Bun.write(pkgPath, JSON.stringify(pkg, null, '\t') + '\n');
		console.log(`Resolved workspace deps in packages/${dir}`);
	}
}
