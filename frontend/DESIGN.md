# KeyMaster Design System

## Brand

- **UI font:** Outfit (`--font-sans`)
- **Wordmark / display:** Fraunces (`--font-display`) — brand name only, not long body copy
- **Primary (action):** Electric Blue `#2563EB` → `brand-600`
- **Atmosphere:** Cyan `#06B6D4` → `accent-500` (gradients, soft glow)
- **Success / XP / done:** Green `#16A34A` / `#10B981` → `success-600` / `success-500`
- **Background:** `#F9FAFB`, soft panel `#EFF6FF`
- **Text:** `#0F172A`

## Role rules

| Role | Color | Use |
|------|-------|-----|
| Action | Blue | Buttons, links, focus, active nav |
| Atmosphere | Cyan | Page glows, hero mesh, brand personality |
| Reward | Green | Learned badges, XP toasts, completed progress |
| Neutral | Slate ink | Body text, borders |

Do not paint every surface with all three — green only for success states.

## Semantic tokens

Defined in `src/index.css` (same names in light/dark):

| Token | Role |
|-------|------|
| `--bg-primary` | Page background |
| `--bg-elevated` | Cards, surfaces |
| `--bg-soft` | Soft blue panel (`#EFF6FF`) |
| `--bg-muted` | Soft fills, progress tracks |
| `--text-primary` | Headings, primary copy |
| `--text-secondary` | Supporting copy |
| `--text-muted` | Captions (WCAG AA) |
| `--border-default` | Borders |
| `--focus-ring` | `focus-visible` rings |

## Components (`src/shared/components/ui.tsx`)

| Component | Use |
|-----------|-----|
| `Button` | `variant`: primary / secondary / ghost |
| `StatusBadge` | `tone`: brand / success / neutral / warning / locked |
| `ProgressBar` | Animated width fill |
| `GlassCard` | Interactive / content containers |
| `EmptyState` | Empty / error edges |
| `KeyCombo` / `KeyCap` | Shortcut display |

## Rules

1. Prefer semantic tokens over raw `slate-*` for text/background.
2. Every interactive control needs `focus-visible`.
3. One status badge per course card — `getCourseStatus()`.
4. Global XP = `user.xp`; course XP = `xp_earned` / `xp_total`.
