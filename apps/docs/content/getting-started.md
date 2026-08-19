## Install

Not published to npm yet — this is the install story once it is. `@basemark/core` plus whichever component packs your document actually uses; none are bundled together, so a `common`-only app doesn't pull in `bio`'s much heavier vendor libraries.

```sh
bun add @basemark/core @basemark/common
# add @basemark/bio and/or @basemark/charts as needed
# React apps also need: bun add @basemark/react
```

Pick whichever consumption path below matches your app. All three resolve the same directive syntax against the same component registry — see [Authoring syntax](/authoring/syntax) for the markdown itself.

## No framework

```ts
import { createRegistry, renderMarkdown } from '@basemark/core';
import { registerCommonComponents } from '@basemark/common';

const registry = createRegistry();
registerCommonComponents(registry);

const root = document.getElementById('app');
renderMarkdown('::button[Click me]{variant="default"}', registry, root);
```

`renderMarkdown()` mounts real DOM nodes directly. Use `renderMarkdownToHtml()` instead if you want a plain HTML string (e.g. to write to a file — no `document` required, works in Node/Bun).

## React

```tsx
import { createRegistry } from '@basemark/core';
import { registerCommonComponents } from '@basemark/common';
import { MarkdownRenderer } from '@basemark/react';

const registry = createRegistry();
registerCommonComponents(registry);

function App() {
	return <MarkdownRenderer source="::button[Click me]{variant='default'}" registry={registry} />;
}
```

Every custom element is wrapped generically via `@lit/react`'s `createComponent()` — a new component pack needs no React-specific code to work here.

## Shareable HTML file, no app at all

No framework, no dependency to install into an app — `@basemark/cli` resolves a markdown file into one self-contained `.html` file instead. See [CLI](/cli) for install and usage.
