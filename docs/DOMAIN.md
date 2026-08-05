# Домен keymaster.pp.ua

Основной адрес сайта: **https://keymaster.pp.ua**

Код фронта сам подставляет `window.location.origin` для Supabase callback — после привязки домена в Vercel менять код не нужно.

---

## Шаг 1. Vercel — добавить домен

1. [vercel.com](https://vercel.com) → проект **Keymaster** (frontend).
2. **Settings → Domains → Add**.
3. Введи **`keymaster.pp.ua`** (корень, без `www`).
4. Vercel покажет, **какие DNS-записи** нужны (скопируй их — ниже типичный вариант).

Опционально добавь **`www.keymaster.pp.ua`** — в `vercel.json` уже есть редирект www → apex.

Старый `*.vercel.app` можно оставить: после деплоя с `vercel.json` запросы с него редиректятся на `keymaster.pp.ua`.

---

## Шаг 2. DNS у регистратора (.pp.ua)

В панели, где куплен домен (nic.ua, HostPro и т.д.) → **DNS / Управление зоной**:

| Имя / Host | Тип | Значение |
|------------|-----|----------|
| `@` (или пусто) | **A** | `76.76.21.21` |
| `www` | **CNAME** | `cname.vercel-dns.com` |

Если Vercel в карточке домена просит **другие** значения — используй **то, что показывает Vercel** (иногда ALIAS/ANAME для apex).

Подожди **5–60 минут**, в Vercel статус домена станет **Valid**.

---

## Шаг 3. Railway (backend)

**Variables** → обнови и **Redeploy**:

```text
FRONTEND_URL=https://keymaster.pp.ua
CORS_ORIGINS=https://keymaster.pp.ua,https://keymaster-liart.vercel.app
```

`VITE_API_BASE` на Vercel **не меняй**, если API по-прежнему на Railway:

```text
https://keymaster-production-2e1e.up.railway.app/api
```

---

## Шаг 4. Supabase

**Authentication → URL configuration**

| Поле | Значение |
|------|----------|
| **Site URL** | `https://keymaster.pp.ua` |
| **Redirect URLs** | `https://keymaster.pp.ua/auth/callback` |
| | `https://keymaster-liart.vercel.app/auth/callback` (временно) |
| | `http://localhost:5173/auth/callback` |

---

## Шаг 5. Vercel — переменные (проверка)

**Settings → Environment Variables** (Production):

```text
VITE_API_BASE=https://keymaster-production-2e1e.up.railway.app/api
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

После любых изменений **Deployments → Redeploy**.

---

## Проверка

1. Браузер: **https://keymaster.pp.ua** — главная KeyMaster, замок HTTPS.
2. Регистрация / вход / рейтинг — без CORS в консоли (F12).
3. Ссылка из письма (если есть) ведёт на `keymaster.pp.ua`.

---

## Почта с домена (позже)

Resend / Custom SMTP в Supabase: верифицируй **keymaster.pp.ua** и отправляй с `noreply@keymaster.pp.ua` — см. `docs/SUPABASE.md`.
