# @basemark/core

The engine behind Basemark: parses Markdown with directive syntax (`::name{attrs}`), resolves each directive against a component registry, validates its props, and renders the result — either to real DOM elements or to a plain HTML string. Framework-agnostic and dependency-light; domain component packages (`@basemark/bio`, `@basemark/common`, `@basemark/charts`) build on top of it.

## Install

```sh
bun add @basemark/core
```

## Usage

```ts
import { createRegistry, renderMarkdown } from '@basemark/core';

const registry = createRegistry();
registry.register('my-widget', {
	tag: 'my-widget-element',
	domain: 'demo',
	title: 'My Widget',
	description: 'A custom element registered directly, without a domain package.',
	schema: { label: { type: 'string', required: true } },
});

renderMarkdown('::my-widget{label="Hello"}', registry); // → a DocumentFragment with <my-widget-element label="Hello">
```

For a static HTML string instead of live DOM (e.g. server-side), use `renderMarkdownToHtml()`.

A bad directive (unknown name, invalid prop, unclosed container) never disappears silently — it renders a visible error element in place, with any swallowed content still shown inside it.

## Theming

`theme.css` ships shadcn-compatible CSS custom properties (`--background`, `--primary`, `--radius`, `--font-sans`, ...) on `:root`/`.dark`, plus base styling that reads them. Every component (this package, `bio`, `common`, `charts`) reads the same tokens inside its own shadow root — retheming is plain CSS, no JS API.

- **Already have a shadcn theme?** Don't import `theme.css` — define the same token names on your own `:root`/`.dark`; custom properties inherit through Shadow DOM for free.
- **Want our defaults, tweaked?** Import `theme.css`, then redefine just the tokens you want on `:root`/`.dark` — last one in the cascade wins, live, no rebuild.

```css
@import '@basemark/core/theme.css';

:root {
	--primary: oklch(0.55 0.2 260);
	--radius: 0.5rem;
	--font-sans: 'Inter', sans-serif;
}
```

`theme.css`'s own default values are a starting palette, not a fixed brand — override anything you don't like.
