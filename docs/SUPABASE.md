# Supabase Auth для KeyMaster

Письма с подтверждением email отправляет **Supabase** — свой SMTP и домен не обязательны.

## 1. Проект Supabase

1. [https://supabase.com](https://supabase.com) → **New project**
2. Запомните пароль БД (для Supabase, не для KeyMaster API)

## 2. Authentication

1. **Authentication** → **Providers** → **Email** — включён
2. **Authentication** → **URL configuration**:
   - **Site URL:** `https://keymaster-liart.vercel.app` (или ваш URL)
   - **Redirect URLs** (добавить все):
     - `https://keymaster-liart.vercel.app/auth/callback`
     - `http://localhost:5173/auth/callback`
3. **Authentication** → **Email** → включите **Confirm email**

## 3. Ключи API

**Project Settings** → **API**:

| Переменная | Откуда |
|------------|--------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon public |
| `SUPABASE_JWT_SECRET` | JWT Secret (только Railway, не в Vercel!) |

## 4. Vercel (frontend)

Environment Variables:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_BASE=https://keymaster-production-2e1e.up.railway.app/api
```

Redeploy после сохранения.

## 5. Railway (backend API)

```
SUPABASE_JWT_SECRET=<JWT Secret из Supabase>
FRONTEND_URL=https://keymaster-liart.vercel.app
```

SMTP переменные **не нужны**, если все регистрации идут через Supabase.

## 6. Админ

Вход **admin** по-прежнему через `ADMIN_EMAIL` / `ADMIN_PASSWORD` и `/auth/login` (Railway), если не создавали того же пользователя в Supabase.

## 7. Проверка

1. Регистрация на сайте → письмо от Supabase
2. Ссылка → `/auth/callback` → вход
3. Прогресс и XP сохраняются в вашей Postgres на Railway (Neon), как раньше

База Supabase используется **только для auth**, не заменяет DATABASE_URL KeyMaster.
