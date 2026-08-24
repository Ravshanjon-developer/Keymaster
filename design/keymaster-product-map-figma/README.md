# KeyMaster — Product Map (Current UI)

Figma Desktop plugin that builds the as-is product map from live screenshots. **Does not redesign.** Stage 1 only. Does not change the KeyMaster app.

## Create the Figma file

1. Open [Figma Desktop](https://www.figma.com/downloads/).
2. **Plugins → Development → Import plugin from manifest…**
3. Select `manifest.json` in this folder (`design/keymaster-product-map-figma/`).
   GitHub: clone this PR branch, or download the folder from the PR Files tab.
4. **File → New design file**, rename it **KeyMaster — Product Map (Current UI)**.
5. Run the plugin **KeyMaster — Product Map (Current UI)** and wait until it closes.

Install **Outfit** and **Fraunces** in Figma (or the plugin falls back to Inter).

Plugin self-check (no Figma required): `node dry-run.mjs` — expects pages 01–07, tokens, components, and 59 as-is shots.

Live unique-page metrics (Vite, do not change the app): `node measure-live.mjs` writes `live-metrics.json`. Current UI: Outfit + Fraunces, navbar 65px glass, footer 105px (`py-9 pb-12`), primary button 44×16 radius, practice rail 240px `#141820`.

## Pages created

| Page | Contents |
|---|---|
| `01 — Product Map` | Unique as-is recreations. Includes guest `/path`, path spine, keyboard gate, hamburger drawers, desktop-task lesson (`desktop:` keys, sim-only XP), Home TJ, authed catalog `0/N`, catalog loading/API-down, authed VS Code course detail (Training/Exam), course not found, and auth-callback error. |
| `02 — User Flows` | F1–F12 from the live router + capture strips |
| `03 — Existing Screens` | As-is desktop, dark, and state captures (59), including path full-scroll |
| `04 — Design System` | Tokens from `tokens.css` / `index.css` |
| `05 — Components` | Button (incl. focus), Input, Badge, KeyCap, Nav, Navbar (default/scrolled/mobile/authed), Progress, Card, OTP, rail, BottomNav, CourseCard, PathNode, Achievement, LearnStatus, FloatingLabelInput, PasswordStrength, Skeleton, Exam |
| `06 — Improved Screens` | Placeholder only: «Этап 2 — не улучшать на этапе 1» |
| `07 — Mobile Screens` | 390 captures. `mobile-authed-08-training-gate.jpg` is the live PracticeKeyboardGate on `/exam` (not the trainer). Closed authed navbar shows Выйти because `.btn-secondary { inline-flex }` wins over `hidden`. |

Do **not** duplicate 20 courses or every lesson. One course detail + hotkey + task + study-only lesson cover the catalog.

## After the file exists

In **Cursor Desktop** (not Cloud Agent): Settings → Tools & MCP → **Figma → Connect**, then continue the agent with the file URL so it can refine via `use_figma` / `generate_figma_design`.
