// Root "release" script. Runs resolve-workspace-deps.ts so `changeset
// publish` ships real versions instead of `workspace:*` (see that file's
// comment), then always restores the source tree afterward — success,
// failure, or Ctrl-C — since local dev wants workspace:* back, not whatever
// version happened to be current at publish time.
const restore = () => Bun.spawnSync(['git', 'checkout', '--', 'packages/*/package.json'], { stdout: 'inherit', stderr: 'inherit' });

const resolve = Bun.spawnSync(['bun', 'run', 'scripts/resolve-workspace-deps.ts'], { stdout: 'inherit', stderr: 'inherit' });
if (resolve.exitCode !== 0) {
	restore();
	process.exit(resolve.exitCode ?? 1);
}

const publish = Bun.spawnSync(['bunx', 'changeset', 'publish'], { stdout: 'inherit', stderr: 'inherit' });
restore();
process.exit(publish.exitCode ?? 1);
