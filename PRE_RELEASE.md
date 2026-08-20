# Pre-release checklist

What's left before `@basemark/*` packages can actually be published to npm.

## Blockers — publish won't work at all without these

- **Every package is `"private": true"`** — including the ones with real content (`core`, `bio`, `common`, `charts`, `react`, `cli`). `npm publish` refuses a private package outright. (`svelte`/`chem` are true empty stubs — not part of this blocker, shouldn't publish yet regardless.)
- ~~**No build step for the library packages**~~ Done — `core`/`bio`/`common`/`charts`/`react` all have a `scripts/build.ts` (Bun bundle, deps externalized, + a `tsc --project tsconfig.build.json` pass for `.d.ts`), and `main`/`types` point at `dist/`. `publishConfig` was ruled out (Bun doesn't merge it into the packed `package.json` — confirmed via `bun pm pack`); went with `dist/` unconditionally instead, which does change internal dev resolution but turned out cheap to absorb: `turbo.json`'s `check-types`/`dev` tasks got `^build` added to `dependsOn`, so `dist/` is produced on demand (cached by turbo, rebuilt only when source actually changes) rather than needing a persistent watch process. Verified end-to-end: clean `check-types`/`test`/`bun pm pack` across all five packages.
- ~~**License is unresolved, not just undocumented.**~~ Done — MIT, root `LICENSE` file added, every publishable package's `package.json` carries `"license": "MIT"`.
- ~~**Changesets isn't actually installed**~~ Done — `@changesets/cli` is a devDependency, `.changeset/config.json` is set up (`access: "public"`, matching the MIT decision), and `bun run changeset`/`version`/`release` scripts exist. No changeset has been added yet — the first one will come from whatever change ships first.
- **`@basemark` npm scope ownership is unconfirmed.** The project name itself is now settled (`basemark`/`@basemark/*`, dropped from ARCHITECTURE.md's open questions) — but whether that scope is actually claimable/claimed on npmjs.com still needs checking before a first publish.

## Needed, but not blocking a first publish

- `repository`/`homepage`/`author` fields are blank in every `package.json` — cosmetic on the npm page, but easy to add.
- No CI publish workflow — `.github/workflows/` only has `deploy-docs.yml`. The usual pattern is `changesets/action` gated on `main`, with an `NPM_TOKEN` secret.
- Versions are all frozen at `0.0.0` — fine until the first real release, then needs a starting version (`0.1.0` is typical pre-1.0).
