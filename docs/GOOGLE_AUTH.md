# Вход через Google (Supabase)

KeyMaster использует **Supabase Auth** — отдельный `GOOGLE_CLIENT_ID` на Railway **не нужен** (старый endpoint `/api/auth/google` — заглушка).

После входа Google пользователь попадает на `/auth/callback`, профиль создаётся в Postgres через `/api/auth/me` (имя из Google `full_name`).

---

## 1. Google Cloud Console

1. [console.cloud.google.com](https://console.cloud.google.com) → проект (или новый).
2. **APIs & Services → OAuth consent screen** — настройте (External, test users при необходимости).
3. **Credentials → Create credentials → OAuth client ID** → **Web application**.
4. **Authorized JavaScript origins** (добавьте все):
   - `https://keymaster.pp.ua`
   - `https://www.keymaster.pp.ua`
   - `https://keymaster-liart.vercel.app`
   - `http://localhost:5173`
5. **Authorized redirect URIs** — **только Supabase**, не ваш сайт:

```text
https://lclkozlclxtyabkceuck.supabase.co/auth/v1/callback
```

(Замените на **Project URL** из Supabase → Settings → API, путь всегда `/auth/v1/callback`.)

Скопируйте **Client ID** и **Client secret**.

---

## 2. Supabase

1. **Authentication → Sign In / Providers → Google** → **Enable**.
2. Вставьте **Client ID** и **Client Secret** → Save.
3. **URL configuration** — уже должны быть:
   - Site URL: `https://keymaster.pp.ua` (или www)
   - Redirect URLs: `https://keymaster.pp.ua/auth/callback`, localhost, vercel.

---

## 3. Проверка

1. Сайт → **Войти** или **Регистрация** → **Войти через Google**.
2. Аккаунт Google → редирект на `…/auth/callback` → dashboard.
3. Тот же email, что уже был с паролем — **привяжется** к одному пользователю в KeyMaster (логика в `supabase_users.py`).

---

## Частые ошибки

| Симптом | Решение |
|---------|---------|
| `redirect_uri_mismatch` | Redirect URI в Google = `https://<project>.supabase.co/auth/v1/callback` |
| После Google белый экран / API | Railway `SUPABASE_JWT_SECRET`, Vercel прокси `/api` |
| Google disabled | Providers → Google → Enable + ключи |
