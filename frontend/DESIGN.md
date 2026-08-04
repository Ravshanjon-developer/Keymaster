# KeyMaster Design System

## Brand

- **UI font:** Outfit (`--font-sans`)
- **Wordmark / display:** Fraunces (`--font-display`) — brand name only, not long body copy
- **Accent:** teal `brand-500`–`brand-700`

## Semantic tokens

Defined in `src/index.css` as CSS variables (same names in light/dark):

| Token | Role |
|-------|------|
| `--bg-primary` | Page background |
| `--bg-elevated` | Cards, surfaces |
| `--bg-muted` | Soft fills, progress tracks |
| `--text-primary` | Headings, primary copy |
| `--text-secondary` | Supporting copy |
| `--text-muted` | Captions (WCAG AA vs surfaces) |
| `--border-default` | Borders |
| `--focus-ring` | `focus-visible` rings |

Use these via `text-[var(--text-primary)]`, `bg-[var(--bg-elevated)]`, or utilities `.text-muted` / `.glass`.

## Components (`src/shared/components/ui.tsx`)

| Component | Use |
|-----------|-----|
| `Button` | `variant`: primary / secondary / ghost; sizes sm/md/lg |
| `StatusBadge` | Course/path status chips (`tone`: brand/success/neutral/warning/locked) |
| `ProgressBar` | Animated width fill |
| `GlassCard` | Interactive / content containers |
| `EmptyState` | Empty / error edges |
| `KeyCombo` / `KeyCap` | Shortcut display |

## Rules

1. Prefer semantic tokens over raw `slate-*` for text/background.
2. Every interactive control needs `focus-visible` (Button / `.btn-*` already include it).
3. One status badge per course card — use `getCourseStatus()` from `shared/lib/courseStatus.ts`.
4. Global XP = `user.xp`; course XP = `xp_earned` / `xp_total` (label `path.courseXp`).
