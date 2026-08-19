# Pre-release checklist

What's left before `@basemark/*` packages can actually be published to npm.

## Blockers — publish won't work at all without these

- **Every package is `"private": true`** — including the real ones (`core`, `bio`, `common`, `charts`, `react`, `svelte`, `cli`). `npm publish` refuses a private package outright.
- **No build step for the library packages.** `main`/`types`/`exports` all point straight at raw `.ts` source (only `cli` has a `build` script, and that's for its standalone binary, not a library dist). A real npm consumer's tooling generally expects compiled `.js` + `.d.ts`, not source TypeScript.
- ~~**License is unresolved, not just undocumented.**~~ Done — MIT, root `LICENSE` file added, every publishable package's `package.json` carries `"license": "MIT"`.
- ~~**Changesets isn't actually installed**~~ Done — `@changesets/cli` is a devDependency, `.changeset/config.json` is set up (`access: "public"`, matching the MIT decision), and `bun run changeset`/`version`/`release` scripts exist. No changeset has been added yet — the first one will come from whatever change ships first.
- **`@basemark` npm scope ownership is unconfirmed.** The project name itself is now settled (`basemark`/`@basemark/*`, dropped from ARCHITECTURE.md's open questions) — but whether that scope is actually claimable/claimed on npmjs.com still needs checking before a first publish.

## Needed, but not blocking a first publish

- `repository`/`homepage`/`author` fields are blank in every `package.json` — cosmetic on the npm page, but easy to add.
- No CI publish workflow — `.github/workflows/` only has `deploy-docs.yml`. The usual pattern is `changesets/action` gated on `main`, with an `NPM_TOKEN` secret.
- Versions are all frozen at `0.0.0` — fine until the first real release, then needs a starting version (`0.1.0` is typical pre-1.0).
