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

Plugin self-check (no Figma required): `node dry-run.mjs` — expects pages 01–07, tokens, components, and 189 as-is shots. Recapture: `node capture-catalog-states.mjs`, `node capture-leaderboard-filter.mjs`, `node capture-mobile-home-authed.mjs`, `node capture-mobile-leaderboard.mjs`, `node capture-mobile-register-catalog.mjs`, `node capture-desktop-task-dashboard.mjs`, `node capture-authed-computer-basics.mjs`, `node capture-course-detail-layouts.mjs`, `node capture-training-empty-done.mjs`, `node capture-empty-learned-loading.mjs`, `node capture-verify-loading-unlocked.mjs`, `node capture-admin-editor-exam.mjs`, `node capture-remaining-loading.mjs`, `node capture-sim-overlays.mjs`.

Live unique-page metrics (Vite, do not change the app): `node measure-live.mjs` writes `live-metrics.json`. Current UI: Outfit + Fraunces, navbar 65px glass, footer 105px (`py-9 pb-12`), primary button 44×16 radius, practice rail 240px `#141820`.

## Pages created

| Page | Contents |
|---|---|
| `01 — Product Map` | Unique as-is recreations. Includes desktop sim overlays (Этот компьютер, wallpaper context menu without paste + with clipboard `Вставить`, Welcome.txt file menu, Проводник empty ПКМ `Обновить`/`Вставить`, folder ПКМ `Новый файл`, file menu `Сжать в ZIP` + ZIP `Извлечь сюда`, Корзина empty / with Welcome.txt / ПКМ `Восстановить`, Пуск/Закреплено, Welcome.txt editor, Клавиатура, Свойства, light theme, task toast, all-complete 12/12, ← К уроку fromLesson, expanded first-task hint, inline rename «Новая папка» + `newfile.txt`, tasks-closed wallpaper without ЗАДАЧИ rail), mobile desktop FileManager 390 (`К практике`, no BottomNav) plus ЗАДАЧИ overlay (`ТЕКУЩАЯ · 1/12`), immersive Code Lab keyboard gate (no exam chrome), Speed mobile gate (chips `Скорость` + `⏱ 1:00` HUD + gate), lesson hotkey gate (MarketingShell `НЕ ИЗУЧЕНО` + `← К каталогу`, no practice chips), mobile Typing (`Показать клавиатуру`), Speed idle (`Старт 60 сек`), Exam setup (`Настройка сессии`), guest hotkey lesson (`PracticeRegisterGate` + KeyCombo), guest task lesson (`PracticeRegisterGate` without `ЗАДАНИЕ`), login `?verified=1` banner, login EMAIL_NOT_VERIFIED resend, Typing EN home-row, mobile Typing code (`javascript` + `Показать клавиатуру`), Typing code (`javascript` langs), Exam capped (`Будет задано: 16`), admin inline edit-lesson, admin achievement edit (`first-win` / `star`), desktop icon ПКМ (`Открыть` only), Code Lab command palette + File/Edit/View/Go/Run/Terminal/Help menus + Manage + light theme (`bolt-theme-light`) + File saved toast + filename.js inline create + Create Folder hint + Quick Open + Terminal + Find + Search + SCM + Run + Extensions + Preview + current/all tasks + Keyboard Visualizer, Speed run HUD (`⏱ 1:00`), Typing busy/paused/result, Training hint (`Начните с Ctrl`) + hint 2 (`Показать ответ` / `Зажмите Ctrl, затем нажмите H`) + hint 3 (`Нажмите: End`, no hint button) + retry (`повтор`) + done weak (`Стоит повторить:`), Training explain (KeyboardTrainer back `ЧТО ДЕЛАЕТ` / `К упражнению`), Training correct (`Верно!` / `Далее →` / `Автоматически через 2…`), Quiz finished (`Основы hotkeys — готово`), Exam timeout (`Время вышло` / `10:02`) + certificate (`СЕРТИФИКАТ` / ≥90%), admin CourseEditor / add-lesson / create / empty / loadings / achievement-create, exam-run loading, leaderboard outside-top `#12`, path/stats/dashboard loading, dashboard daily empty, route PageFallback (3-card), verify-email loading/ok/error, achievements locked/empty/loading/unlocked mix, PracticeShell loading (training/speed/review), mobile week-empty leaderboard, leaderboard empty/period-empty/API-down/loading, lesson loading/study-only/done, training empty/done, review empty, six `/courses/:slug` layouts, desktop-task lesson (`Папка Practice`), path spine, keyboard gate, authed catalog `0/N`, and mobile Home/Leaderboard/catalog/Register/Dashboard. |
| `02 — User Flows` | F1–F12 from the live router + capture strips |
| `03 — Existing Screens` | As-is desktop, dark, and state captures (189) |
| `04 — Design System` | Tokens from `tokens.css` / `index.css` |
| `05 — Components` | Button (incl. focus), Input, Badge, KeyCap, Nav, Navbar (default/scrolled/mobile/authed), Progress, Card, OTP, rail, BottomNav, CourseCard, PathNode, Achievement, LearnStatus, FloatingLabelInput, PasswordStrength, Skeleton, Exam |
| `06 — Improved Screens` | Placeholder only: «Этап 2 — не улучшать на этапе 1» |
| `07 — Mobile Screens` | 390 captures covering all four BottomNav tabs plus Register (BottomNav hidden), Dashboard (Кабинет, no tab), authed computer-basics course detail (Desktop CTA), authed week-empty leaderboard, immersive desktop sim (`К практике` + FileManager, no BottomNav) plus ЗАДАЧИ overlay, immersive Code Lab keyboard gate, Speed gate after `Старт 60 сек`, hotkey lesson gate (`НЕ ИЗУЧЕНО` + `← К каталогу`), Typing (`Показать клавиатуру`), Typing code (`javascript` + `Показать клавиатуру`), Speed idle, and Exam setup. Guest vs authed Home, Leaderboard, and Courses. Authed catalog shows `0/16 сочетаний`. `mobile-authed-08-training-gate.jpg` is PracticeKeyboardGate on `/exam`. Closed authed navbar shows Выйти because `.btn-secondary { inline-flex }` wins over `hidden`. |

Do **not** duplicate 20 courses or every lesson. Six unique `/courses/:slug` layouts (guest/authed × computer-basics Desktop vs programmer-basics start+Training vs vscode Training) plus hotkey, task, study-only (guest / authed / learned), desktop-task, loading, and done lesson layouts cover the catalog.

## After the file exists

In **Cursor Desktop** (not Cloud Agent): Settings → Tools & MCP → **Figma → Connect**, then continue the agent with the file URL so it can refine via `use_figma` / `generate_figma_design`.
