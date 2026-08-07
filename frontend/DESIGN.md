# KeyMaster Design System (2026)

Premium SaaS polish on top of the existing KeyMaster brand — **not** a clone of Duolingo/Notion.

## Brand (unchanged)

- **UI font:** Outfit (`--font-sans`)
- **Wordmark:** Fraunces (`--font-display`)
- **Primary:** Electric Blue `#2563EB` → `brand-600`
- **Atmosphere:** Cyan → `accent-*` (mesh, hero)
- **Success / XP:** Green → `success-*`

## Token files

| File | Contents |
|------|----------|
| `src/styles/tokens.css` | Spacing, radius, shadows, motion, z-index, warning/danger/info |
| `src/index.css` | `@theme` palette, semantic surfaces, component classes |

## Spacing scale

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96` → `--space-1` … `--space-24`

## Radius

| Token | Use |
|-------|-----|
| `--radius-input` | Inputs, OTP |
| `--radius-button` | Buttons |
| `--radius-card` | GlassCard |
| `--radius-dropdown` | Nav menus |

## Shadows

`--shadow-sm` · `--shadow-md` · `--shadow-lg` · `--shadow-float` · `--shadow-premium` — soft, no heavy black.

## Typography utilities

| Class | Use |
|-------|-----|
| `text-display` | Hero wordmark blocks |
| `text-h1` / `text-page-title` | Page titles |
| `text-h2` / `text-h3` | Sections |
| `text-body-lg` | Lead paragraphs |
| `text-muted` | Secondary body |
| `text-caption` | Hints, meta |
| `text-button` | Button labels |

## Semantic surfaces (`:root` / `html.dark`)

`--bg-primary` · `--bg-elevated` · `--bg-soft` · `--bg-muted` · `--text-*` · `--border-default` · `--focus-ring` · `--surface-glass`

## Components (`src/shared/components/ui.tsx`)

| Component | Notes |
|-----------|--------|
| `Button` | `primary` · `secondary` · `ghost` · `outline` |
| `GlassCard` | Premium shadow on hover |
| `Skeleton` | Shimmer (respects `prefers-reduced-motion`) |
| `EmptyState` | Icon + title + optional action |
| `FloatingLabelInput` | Focus, error, password toggle |
| `StatusBadge` · `ProgressBar` · `KeyCombo` | Unchanged roles |

## Navigation

- `.km-nav-bar` — sticky glass + blur
- `.km-nav-bar--scrolled` — elevation on scroll
- `.km-nav-link` / `--active` — underline animation

## Rules

1. Prefer tokens and semantic CSS over one-off pixels/colors.
2. Animations: **transform + opacity** only; honor reduced motion.
3. Icons: **Lucide** only.
4. Every interactive control: visible `focus-visible` / focus ring.
5. Do not change routing, business logic, or page inventory — polish in place.

## Rollout phases

1. **Done:** tokens, buttons, nav, core UI primitives, toasts, forms base.
2. **Done:** `PageShell` / `PageHeader` / `StatTile`, courses, training, dashboard, leaderboard shell, review/quiz/lesson loading, achievements empty states.
3. **Done:** skeleton grids on lazy routes, shimmer skeletons, EmptyState with icons on key edges.
