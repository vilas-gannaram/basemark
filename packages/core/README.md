# @basemark/core

remark-directive parser + component registry + AI prompt generation + vanilla DOM renderer. See [ARCHITECTURE.md](../../ARCHITECTURE.md) for the full pipeline and registry design.

## Theming

`theme.css` ships a set of shadcn-compatible CSS custom properties (`--background`, `--foreground`, `--primary`, `--radius`, `--font-sans`, ...) on `:root`/`.dark`, plus the base styling (headings, tables, code, `::selection`) that reads them. Every component — in this package and in `@basemark/bio`/`@basemark/common` — reads these same tokens inside its own shadow root, so retheming is just CSS, no JS API:

- **Already have a shadcn theme?** Don't import `theme.css` at all — define the same token names on your own `:root`/`.dark` and every component picks them up for free (custom properties inherit through Shadow DOM boundaries).
- **Want our defaults, but different colors/fonts/radius?** Import `theme.css`, then redefine just the tokens you want to change on `:root`/`.dark` afterward in your own stylesheet — last one in the cascade wins, and components read the tokens live, so no rebuild step or theming API is involved.

```css
@import '@basemark/core/theme.css';

:root {
	--primary: oklch(0.55 0.2 260);
	--radius: 0.5rem;
	--font-sans: 'Inter', sans-serif;
}
```

`theme.css`'s own default values (see `examples/vanilla` and `examples/react`'s `index.html` for a worked example of overriding them) are a starting palette, not a fixed brand — override anything you don't like.
