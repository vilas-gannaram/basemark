`@basemark/core` is the framework-agnostic engine everything else here is built on — a `remark-directive` parser, a component registry, and a render step. No component packs are bundled in; register whichever ones you actually need (`@basemark/bio`, `@basemark/common`, `@basemark/charts`, ...).

## Install

```sh
bun add @basemark/core
```

## The pipeline

```
Markdown text
   │  remark-parse + remark-directive + remark-gfm
mdast
   │  resolves each directive against the Component Registry,
   │  validates its props against that component's schema
hast
   │  render step (see below)
DOM / static HTML / React tree
```

Two things worth knowing before writing a real document, both covered on their own page:

- **[Authoring syntax](/authoring/syntax)** — the `remark-directive` grammar itself: leaf/text/container directives, and the two failure modes worth knowing up front.
- **[Tiering model](/authoring/tiering)** — the design rule behind every component's prop list: never make an author supply a data blob when a short identifier is enough.

## The registry

Every component — `card`, `structure`, `bar-chart`, all of them — is a name registered against a manifest: a prop schema, a domain, and a render target (a Web Component tag, by default). `createRegistry()` starts empty; each pack's `register*Components()` fills it in.

```ts
import { createRegistry } from '@basemark/core';
import { registerCommonComponents } from '@basemark/common';

const registry = createRegistry();
registerCommonComponents(registry);
```

A registry with nothing registered isn't an error — an unregistered directive just fails visibly instead (see Authoring syntax).

## AI-facing prompts, generated not hand-written

`generateSystemPrompt(registry)` turns whatever's registered into an index an AI author can read directly — one line per component, no separate doc to keep in sync. `describeComponent(registry, name)` expands one entry to its full prop list on demand. Both come straight from the same registry your app renders with, so the prompt can never drift from what's actually available.

## Rendering

Three render paths, one parser:

- `renderMarkdown(source, registry, root)` — mounts real DOM directly (browser only).
- `renderMarkdownToHtml(source, registry)` — returns a plain string, no `document` required. Every narrative page on this site (including this one) is rendered this way.
- `@basemark/react`'s `MarkdownRenderer` — same parse, wrapped as a React component.

See [Getting started](/getting-started) for all three, with code.
