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

Plugin self-check (no Figma required): `node dry-run.mjs` — expects pages 01–07, tokens, components, and 118 as-is shots. Recapture: `node capture-catalog-states.mjs`, `node capture-leaderboard-filter.mjs`, `node capture-mobile-home-authed.mjs`, `node capture-mobile-leaderboard.mjs`, `node capture-mobile-register-catalog.mjs`, `node capture-desktop-task-dashboard.mjs`, `node capture-authed-computer-basics.mjs`, `node capture-course-detail-layouts.mjs`, `node capture-training-empty-done.mjs`, `node capture-empty-learned-loading.mjs`, `node capture-verify-loading-unlocked.mjs`, `node capture-admin-editor-exam.mjs`, `node capture-remaining-loading.mjs`, `node capture-sim-overlays.mjs`.

Live unique-page metrics (Vite, do not change the app): `node measure-live.mjs` writes `live-metrics.json`. Current UI: Outfit + Fraunces, navbar 65px glass, footer 105px (`py-9 pb-12`), primary button 44×16 radius, practice rail 240px `#141820`.

## Pages created

| Page | Contents |
|---|---|
| `01 — Product Map` | Unique as-is recreations. Includes desktop sim overlays (Этот компьютер, wallpaper context menu, Проводник, Корзина, Пуск/Закреплено, Welcome.txt editor, Клавиатура, Свойства), Code Lab command palette + Quick Open + Terminal, admin CourseEditor / add-lesson / create / empty / loadings / achievement-create, exam-run loading, leaderboard outside-top `#12`, path/stats/dashboard loading, dashboard daily empty, route PageFallback (3-card), verify-email loading/ok/error, achievements locked/empty/loading/unlocked mix, PracticeShell loading (training/speed/review), mobile week-empty leaderboard, leaderboard empty/period-empty/API-down/loading, lesson loading/study-only/done, training empty/done, review empty, six `/courses/:slug` layouts, desktop-task lesson (`Папка Practice`), path spine, keyboard gate, authed catalog `0/N`, and mobile Home/Leaderboard/catalog/Register/Dashboard. |
| `02 — User Flows` | F1–F12 from the live router + capture strips |
| `03 — Existing Screens` | As-is desktop, dark, and state captures (118) |
| `04 — Design System` | Tokens from `tokens.css` / `index.css` |
| `05 — Components` | Button (incl. focus), Input, Badge, KeyCap, Nav, Navbar (default/scrolled/mobile/authed), Progress, Card, OTP, rail, BottomNav, CourseCard, PathNode, Achievement, LearnStatus, FloatingLabelInput, PasswordStrength, Skeleton, Exam |
| `06 — Improved Screens` | Placeholder only: «Этап 2 — не улучшать на этапе 1» |
| `07 — Mobile Screens` | 390 captures covering all four BottomNav tabs plus Register (BottomNav hidden), Dashboard (Кабинет, no tab), authed computer-basics course detail (Desktop CTA), and authed week-empty leaderboard. Guest vs authed Home, Leaderboard, and Courses. Authed catalog shows `0/16 сочетаний`. `mobile-authed-08-training-gate.jpg` is PracticeKeyboardGate on `/exam`. Closed authed navbar shows Выйти because `.btn-secondary { inline-flex }` wins over `hidden`. |

Do **not** duplicate 20 courses or every lesson. Six unique `/courses/:slug` layouts (guest/authed × computer-basics Desktop vs programmer-basics start+Training vs vscode Training) plus hotkey, task, study-only (guest / authed / learned), desktop-task, loading, and done lesson layouts cover the catalog.

## After the file exists

In **Cursor Desktop** (not Cloud Agent): Settings → Tools & MCP → **Figma → Connect**, then continue the agent with the file URL so it can refine via `use_figma` / `generate_figma_design`.
