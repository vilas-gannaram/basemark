# Pre-release checklist

What's left before `@basemark/*` packages can actually be published to npm. Nothing here is done yet.

## Blockers — publish won't work at all without these

- **Every package is `"private": true`** — including the real ones (`core`, `bio`, `common`, `charts`, `react`, `svelte`, `cli`). `npm publish` refuses a private package outright.
- **No build step for the library packages.** `main`/`types`/`exports` all point straight at raw `.ts` source (only `cli` has a `build` script, and that's for its standalone binary, not a library dist). A real npm consumer's tooling generally expects compiled `.js` + `.d.ts`, not source TypeScript.
- **License is unresolved, not just undocumented.** `"license": "UNLICENSED"` in every `package.json`, no `LICENSE` file anywhere. Needs a real license (MIT/Apache-2.0/etc.) chosen deliberately if the intent is for others to use this.
- **Changesets isn't actually installed** — ARCHITECTURE.md §8 names it as the release tool, but there's no `@changesets/cli` dependency and no `.changeset/` directory. Needs `bunx changeset init` at minimum.
- **`@basemark` npm scope ownership is unconfirmed**, and the project name itself is still an open question (ARCHITECTURE.md §9). Worth locking down before publishing — a published npm name is close to permanent.

## Needed, but not blocking a first publish

- `repository`/`homepage`/`author` fields are blank in every `package.json` — cosmetic on the npm page, but easy to add.
- No CI publish workflow — `.github/workflows/` only has `deploy-docs.yml`. The usual pattern is `changesets/action` gated on `main`, with an `NPM_TOKEN` secret.
- Versions are all frozen at `0.0.0` — fine until the first real release, then needs a starting version (`0.1.0` is typical pre-1.0).
