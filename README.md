# sp-extensions

Themes (and later, plugins) for [Super Productivity](https://super-productivity.com),
by [@sleuthy-sloth](https://github.com/sleuthy-sloth).

## Themes

| Theme | Direction |
| --- | --- |
| [`warm-paper.css`](themes/warm-paper.css) | Cream paper, warm brown-grey ink, soft rounded task cards with airy gaps, dusty periwinkle + apricot accents, gentle motion. Light-first with a warm charcoal dark variant. |

### Install a theme

1. Download the `.css` file (or clone this repo).
2. In Super Productivity: **Settings → General → Theme → Install theme**, pick the file.
3. Select it in the same theme list.

Themes are stored per device in IndexedDB — they are not synced with your task
data, so install the file on each device (desktop, iPhone, Android).

### Theme constraints

Super Productivity validates installed themes. These are rejected, so a theme
here must stay within them:

- payload over 500 KB
- `@import`, `url(...)`, `src(...)`, `image(...)`, `image-set(...)` — remote and
  bundled assets are unsupported, so no webfonts or background images
- required tokens `--surface-1`, `--surface-2`, `--ink`, `--ink-on-channel`

Tokens must be overridden on `body` (light) or `body.isDarkTheme` (dark), not
`:root` — the base layer declares them directly on `body`, which beats an
inherited `:root` value regardless of specificity.

Fonts are limited to what the OS already has (`--font-primary-stack` can only
name installed families).

## Plugins

None yet.

## License

MIT — see [LICENSE](LICENSE).
