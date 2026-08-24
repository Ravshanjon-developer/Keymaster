# KeyMaster — Product Map (Current UI)

Figma Desktop plugin that builds the as-is product map from live screenshots. **Does not redesign.** Stage 1 only. Does not change the KeyMaster app.

## Create the Figma file

1. Open [Figma Desktop](https://www.figma.com/downloads/).
2. **Plugins → Development → Import plugin from manifest…**
3. Select `manifest.json` in this folder (`design/keymaster-product-map-figma/`).
4. **File → New design file**, rename it **KeyMaster — Product Map (Current UI)**.
5. Run the plugin **KeyMaster — Product Map (Current UI)** and wait until it closes.

Install **Outfit** and **Fraunces** in Figma (or the plugin falls back to Inter).

## Pages created

| Page | Contents |
|---|---|
| `01 — Product Map` | 4 layouts, unique pages, grouping rules |
| `02 — User Flows` | F1–F12 from the live router |
| `03 — Existing Screens` | As-is desktop, dark, and state captures |
| `04 — Design System` | Tokens from `tokens.css` / `index.css` |
| `05 — Components` | Button, Input, Badge, KeyCap, Nav, Progress, Card, OTP, rail, BottomNav |
| `06 — Improved Screens` | Placeholder only: «Этап 2 — не улучшать на этапе 1» |
| `07 — Mobile Screens` | 390 captures (BottomNav, keyboard gate) |

Do **not** duplicate 20 courses or every lesson. One course detail + hotkey lesson + task lesson cover the catalog.

## After the file exists

In **Cursor Desktop** (not Cloud Agent): Settings → Tools & MCP → **Figma → Connect**, then continue the agent with the file URL so it can refine via `use_figma` / `generate_figma_design`.
