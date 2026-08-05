# Supabase Auth для KeyMaster

Письма с подтверждением email отправляет **Supabase** — свой SMTP и домен не обязательны.

## 1. Проект Supabase

1. [https://supabase.com](https://supabase.com) → **New project**
2. Запомните пароль БД (для Supabase, не для KeyMaster API)

## 2. Authentication

1. **Authentication** → **Providers** → **Email** — включён
2. **Authentication** → **URL configuration**:
   - **Site URL:** `https://keymaster.pp.ua`
   - **Redirect URLs** (добавить все):
     - `https://keymaster.pp.ua/auth/callback`
     - `https://keymaster-liart.vercel.app/auth/callback` (если старый URL ещё в Vercel)
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
SUPABASE_URL=https://lclkozlclxtyabkceuck.supabase.co
FRONTEND_URL=https://keymaster.pp.ua
```

SMTP переменные **не нужны**, если все регистрации идут через Supabase.

## 6. Админ

Вход **admin** по-прежнему через `ADMIN_EMAIL` / `ADMIN_PASSWORD` и `/auth/login` (Railway), если не создавали того же пользователя в Supabase.

## 7. Проверка

1. Регистрация на сайте → письмо от Supabase (код + ссылка)
2. **Код:** 6 цифр на экране «Проверьте почту» → сразу dashboard (удобно с телефона → ноут)
3. **Ссылка:** `/auth/callback` → вход на том устройстве, где открыли ссылку
4. Прогресс и XP сохраняются в вашей Postgres на Railway (Neon), как раньше

## 7.1. Код в письме (Confirm signup)

Чтобы в письме была **6-значная** `{{ .Token }}`:

1. **Project Settings → Authentication → SMTP** (или **Set up SMTP**) — Resend/Brevo, домен не обязателен на старте (тестовый отправитель Resend).
2. **Authentication → Emails → Confirm signup** — только код (без ссылки):

```html
<h2>KeyMaster</h2>
<p>Ваш код подтверждения:</p>
<p style="font-size:24px;letter-spacing:0.2em"><strong>{{ .Token }}</strong></p>
<p>Код действует ограниченное время. Введите его на сайте после регистрации.</p>
```

Не добавляйте `{{ .ConfirmationURL }}`, если нужен вход **только по коду**.

3. **Email OTP length** = 6 в **Sign In / Providers → Email**.

Без Custom SMTP и `{{ .Token }}` в шаблоне код в письме не появится.

База Supabase используется **только для auth**, не заменяет DATABASE_URL KeyMaster.

## 8. Письмо не приходит

Кнопка «Отправить письмо ещё раз» на сайте **просит Supabase отправить письмо**. KeyMaster письма сам не шлёт.

1. Gmail → **Спам**, **Промоакции**, поиск `supabase`.
2. **Authentication → Rate Limits** — на free tier мало писем в час; подождите 1 час.
3. **Authentication → Audit Logs** — было ли событие отправки, есть ли ошибка.
4. **Быстрый вход без письма:** **Authentication → Users** → `ravtol1207@gmail.com` → открыть пользователя → **Confirm user** / подтвердить email → снова **Войти** на сайте.
5. Для теста без письма: **Sign In / Providers → Email** → выключить обязательное **Confirm email** (только временно).
6. Стабильная доставка: **Custom SMTP** в Supabase (Resend, Brevo и т.д.), не обязательно Postal.
