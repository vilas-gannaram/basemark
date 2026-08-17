# @basemark/core

remark-directive parser + component registry + AI prompt generation + vanilla DOM renderer. See [ARCHITECTURE.md](../../ARCHITECTURE.md) for the full pipeline and registry design.

## Theming

`theme.css` ships shadcn-compatible CSS custom properties (`--background`, `--primary`, `--radius`, `--font-sans`, ...) on `:root`/`.dark`, plus base styling that reads them. Every component (this package, `bio`, `common`) reads the same tokens inside its own shadow root — retheming is plain CSS, no JS API.

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

`theme.css`'s own default values (see `examples/vanilla` and `examples/react`'s `index.html` for a worked example of overriding them) are a starting palette, not a fixed brand — override anything you don't like.
