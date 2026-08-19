Pick whichever consumption path matches your app. All three resolve the same directive syntax against the same component registry — see [Authoring syntax](/authoring/syntax) for the markdown itself.

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

```sh
bun run packages/cli/src/index.ts render doc.md -o doc.html
# or, after `bun run build` in packages/cli:
./dist/basemark render doc.md -o doc.html
```

Resolves `doc.md` into one self-contained `.html` file — open it in any browser. The component runtime and theme are inlined, split per domain, so a `common`-only document doesn't pay for `bio`'s much heavier vendor libraries.
