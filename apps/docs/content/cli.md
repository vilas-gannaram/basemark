`@basemark/cli` resolves a markdown(+directives) file into one self-contained `.html` file — open it in any browser, no server, no build step, nothing else the reader needs to install. This is the third consumption path from [the introduction](/): for when there's no app to embed Basemark into at all, just a document to hand someone.

## Install

```sh
npx @basemark/cli render doc.md -o doc.html
```

Runs on plain Node. `dist/index.js` bundles every dependency in, including `@basemark/bio`/`common`/`charts`.

## Usage

```sh
basemark render doc.md -o doc.html
basemark skill install [<dir>] [--global]
basemark help
```

`render` is the one most people want — one input file, one output file. `skill install` generates and installs a Claude Skill for authoring Basemark documents, derived from the live component registry: an index of every registered component plus one reference file per component with its full prop details. Installs to `.claude/skills/basemark/` by default, `~/.claude/skills/basemark/` with `--global`, or wherever `<dir>` points.

## What's actually inside the output file

The component runtime and theme are inlined, but only for the domains the document actually resolves a tag from — a `common`-only document doesn't ship `bio`'s vendor libraries (3Dmol.js, protvista-uniprot, LocusZoom.js), which run into the tens of megabytes uncompressed. The CLI walks the resolved hast tree, works out which domains (`common`/`bio`/`charts`) are actually in use, and inlines only those runtime bundles plus a shared `base` bundle every document needs.

A bad directive still fails visibly in the output file, exactly like every other render path — a `basemark-error` element, not a blank space.
