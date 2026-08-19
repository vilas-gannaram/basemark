# Pre-release checklist

What's left before `@basemark/*` packages can actually be published to npm.

## Blockers — publish won't work at all without these

- **Every package is `"private": true`** — including the ones with real content (`core`, `bio`, `common`, `charts`, `react`, `cli`). `npm publish` refuses a private package outright. (`svelte`/`chem` are true empty stubs — not part of this blocker, shouldn't publish yet regardless.)
- **No build step for the library packages, and the approach isn't decided yet — paused mid-attempt, see below.** `main`/`types`/`exports` all point straight at raw `.ts` source (only `cli` has a `build` script, and that's for its standalone binary, not a library dist). A real npm consumer's tooling generally expects compiled `.js` + `.d.ts`, not source TypeScript.

  What's been ruled out, so the next attempt doesn't redo this:
  - **`publishConfig` doesn't work with this repo's toolchain.** The plan was `main`/`types`/`exports` pointing at `src/` as always (zero risk to internal dev resolution — Vite/Astro/Bun/tsc all keep working exactly as today), with a `publishConfig` block overriding those fields to `dist/` only in the published tarball — the standard npm-native mechanism for exactly this problem. Verified end-to-end on `@basemark/core` (`bun run build` produced a working `dist/index.js` + `.d.ts`, smoke-tested by importing it directly) — but `bun pm pack` / `bun publish --dry-run` both confirmed `publishConfig` is **not merged into the packed `package.json`**. The tarball would ship with `main`/`exports` still pointing at `./src/index.ts`, which doesn't even exist in the packed files (only `dist/` does) — broken on install.
  - **The only verified-working alternative is pointing `main`/`exports` straight at `dist/` unconditionally** — but since a present `exports` field overrides top-level `main`/`types` entirely for any exports-aware resolver, that means every *internal* consumer (Vite/Astro dev servers, `bun test`, `tsc --noEmit` across the monorepo) would also resolve to `dist/` — not just external npm consumers. Editing `packages/bio/src/*.ts` would stop instantly reflecting in `examples/react`'s dev server without a rebuild (or a watch-mode build) in between. That's a real dev-workflow change, and it also means `turbo.json`'s `check-types`/`test` tasks need `^build` added to their `dependsOn` (currently `check-types` only depends on `^check-types`), since a dependency's type-checking now needs its `dist/index.d.ts` to actually exist.
  - Bundler choice for that `dist/` build (`tsc` vs `tsup` vs `bun build`) was picked (`bun build`, JS bundler with externalized deps + a separate `tsc --emitDeclarationOnly` pass for `.d.ts` — prototyped and confirmed working on `core`) — the open question is specifically the dev-workflow tradeoff above, not the bundler.
- ~~**License is unresolved, not just undocumented.**~~ Done — MIT, root `LICENSE` file added, every publishable package's `package.json` carries `"license": "MIT"`.
- ~~**Changesets isn't actually installed**~~ Done — `@changesets/cli` is a devDependency, `.changeset/config.json` is set up (`access: "public"`, matching the MIT decision), and `bun run changeset`/`version`/`release` scripts exist. No changeset has been added yet — the first one will come from whatever change ships first.
- **`@basemark` npm scope ownership is unconfirmed.** The project name itself is now settled (`basemark`/`@basemark/*`, dropped from ARCHITECTURE.md's open questions) — but whether that scope is actually claimable/claimed on npmjs.com still needs checking before a first publish.

## Needed, but not blocking a first publish

- `repository`/`homepage`/`author` fields are blank in every `package.json` — cosmetic on the npm page, but easy to add.
- No CI publish workflow — `.github/workflows/` only has `deploy-docs.yml`. The usual pattern is `changesets/action` gated on `main`, with an `NPM_TOKEN` secret.
- Versions are all frozen at `0.0.0` — fine until the first real release, then needs a starting version (`0.1.0` is typical pre-1.0).
