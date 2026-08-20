`@basemark/cli` resolves a markdown(+directives) file into one self-contained `.html` file — open it in any browser, no server, no build step, nothing else the reader needs to install. This is the third consumption path from [the introduction](/): for when there's no app to embed Basemark into at all, just a document to hand someone.

## Install

Not published to npm yet. For now, run it from source or compile the standalone binary yourself:

```sh
bun install
bun run packages/cli/src/index.ts render doc.md -o doc.html   # run from source

# or, compile a standalone binary once:
cd packages/cli && bun run build
./dist/basemark render doc.md -o doc.html
```

## Usage

```sh
basemark render doc.md -o doc.html
```

That's the whole interface — one command, one input file, one output file.

## What's actually inside the output file

The component runtime and theme are inlined, but only for the domains the document actually resolves a tag from — a `common`-only document doesn't ship `bio`'s vendor libraries (3Dmol.js, protvista-uniprot, LocusZoom.js), which run into the tens of megabytes uncompressed. The CLI walks the resolved hast tree, works out which domains (`common`/`bio`/`charts`) are actually in use, and inlines only those runtime bundles plus a shared `base` bundle every document needs.

A bad directive still fails visibly in the output file, exactly like every other render path — a `basemark-error` element, not a blank space.
