# @basemark/react

## 0.1.3

### Patch Changes

- Fix `dependencies`/`devDependencies` shipping the literal `workspace:*` protocol string instead of a real version. `@changesets/cli`'s publish command only rewrites workspace ranges for pnpm/yarn — anything else (npm, Bun included) falls through with zero rewriting, so `npm install @basemark/bio` (and anything else depending on `@basemark/core`) failed outright with `EUNSUPPORTEDPROTOCOL`. The root `release` script now resolves workspace ranges to real versions before publishing (`scripts/resolve-workspace-deps.ts`) and restores them after.

## 0.1.1

### Patch Changes

- 2fdf4ea: Add an install section to each README and repository/homepage/bugs metadata to each package.json, so the npm page for each package links back to the repo, docs site, and issue tracker.
- Updated dependencies [2fdf4ea]
  - @basemark/core@0.1.1
