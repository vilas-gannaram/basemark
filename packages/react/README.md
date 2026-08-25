# @basemark/react

React binding for `@basemark/core`. Renders a parsed Markdown+directive document as a real React tree — every resolved custom element wrapped generically via `@lit/react`'s `createComponent()`, not hand-written per component.

## Install

```sh
bun add @basemark/core @basemark/react
```

Requires `react` >=18 as a peer dependency (not bundled).

## Usage

```tsx
import { createRegistry } from '@basemark/core';
import { registerCommonComponents } from '@basemark/common';
import { MarkdownRenderer } from '@basemark/react';

const registry = createRegistry();
registerCommonComponents(registry);

<MarkdownRenderer source={':::card{title="Hello"}\nSome content.\n:::'} registry={registry} />;
```

`registerBioComponents()` is async (its vendor libraries load via dynamic `import()`) — `await` it before the first render so `MarkdownRenderer`'s custom-element lookup finds an already-`define()`d class:

```tsx
import { registerBioComponents } from '@basemark/bio';

await registerBioComponents(registry);
```

## The escape hatch

A component registered with `{ type: 'react', component: MyComponent }` (ARCHITECTURE.md §6) skips the custom-element boundary entirely — `MarkdownRenderer` renders it as a plain React component instead of a wrapped tag. App-local only; published packages (`bio`/`common`/`charts`) never use this.
