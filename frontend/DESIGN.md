# KeyMaster Design System (2026)

Premium SaaS polish on top of the existing KeyMaster brand — **not** a clone of Duolingo/Notion.

## Brand (unchanged)

- **UI font:** Outfit (`--font-sans`)
- **Wordmark:** Fraunces (`--font-display`)
- **Primary / Accent:** Electric Blue → `brand-600` / `--color-accent`
- **Atmosphere:** Cyan → `accent-*` (mesh, hero)
- **Success / XP:** Green → `success-*` / `--color-success`

## Token files

| File | Contents |
|------|----------|
| `src/styles/tokens.css` | Spacing, radius, shadows (light/dark), motion, z-index, status colors |
| `src/index.css` | `@theme` palette, semantic surfaces (both themes), component classes |

## Semantic surfaces (use these in UI)

| Token | Light | Dark role |
|-------|-------|-----------|
| `--bg-primary` | Page canvas (neutral, not pure white) | Deepest background |
| `--bg-surface` | Section wash | Container layer |
| `--bg-elevated` | Panels, inputs | Raised panels |
| `--bg-card` | Card fill (white) | Card layer |
| `--bg-soft` | Brand-tinted areas | Brand depth |
| `--text-primary` / `--text-secondary` / `--text-muted` | WCAG-tuned hierarchy | Stronger muted contrast |
| `--color-accent` | Primary actions | Slightly softer blue |
| `--border-default` / `--border-hover` | 1px system | Subtle borders |
| `--focus-ring` | Keyboard focus | Same |

Also: `--bg-hover`, `--bg-active`, `--bg-disabled`, `--text-disabled`, `--color-accent-muted`.

## Spacing scale

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96` → `--space-1` … `--space-24`

## Shadows

Light & dark each define: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-float`, `--shadow-premium` (dark premium adds inner highlight).

## Components

| Class / component | Notes |
|-------------------|--------|
| `.km-card` / `.km-card--interactive` | Gradient card, hover lift (transform) |
| `.km-feature-tile` | Home feature blocks |
| `.km-nav-bar` / `.km-nav-link` | Glass nav, scroll elevation |
| `.km-theme-toggle` | Theme switch micro-animation |
| `.km-password-strength` | Register password meter |
| `GlassCard` | Wraps `.km-card` |
| `Button` | `loading` prop; primary uses `.is-loading` spinner |
| `FloatingLabelInput` | Focus/error/success, password toggle & strength |

## Theme transition

`themeStore` adds `html.theme-animate` for ~280ms when toggling light/dark (background, border, color).

## Rules

1. No ad-hoc HEX in components — semantic tokens or `@theme` palette.
2. Animations: **transform + opacity**; 150–250ms; honor `prefers-reduced-motion`.
3. Icons: **Lucide** only.
4. Visible `focus-visible` on interactive controls.
5. Do not change routing, business logic, or page inventory — polish in place.

## Final polish (2026)

- Light: off-white page, white cards, depth via shadow + border.
- Dark: 4-level depth (primary → surface → elevated → card).
- Unified buttons, inputs, course cards, hero, navbar in both themes.
