# KeyMaster — деплой (Vercel + Railway + Neon)

Порядок важен: сначала БД → потом API → потом фронт.

---

## 0. Подготовка (на компьютере)

1. Код должен быть в **GitHub** (приватный или публичный репозиторий).
2. Сгенерируй секреты:

```bash
python scripts/gen_secrets.py
```

Сохрани вывод (`SECRET_KEY`, `ADMIN_PASSWORD` и т.д.) в надёжном месте — **не коммить** в git.

---

## 1. Neon (база PostgreSQL)

1. Зайди на [https://neon.tech](https://neon.tech) → Sign up → **Create project**.
2. Имя проекта: например `keymaster`.
3. В Dashboard → **Connection details** скопируй connection string.
4. Переделай URL под async SQLAlchemy:

Исходный Neon (пример):
```text
postgresql://user:pass@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
```

Нужно для KeyMaster:
```text
postgresql+asyncpg://user:pass@ep-xxxx.region.aws.neon.tech/neondb?ssl=require
```

Важно:
- `postgresql://` → `postgresql+asyncpg://`
- `sslmode=require` → `ssl=require` (для asyncpg)

Пароль из URL, если есть спецсимволы, должен быть URL-encoded.

---

## 2. Railway (backend / FastAPI)

1. Зайди на [https://railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Выбери репозиторий KeyMaster.
3. **Root Directory** сервиса: `backend`  
   (Settings → Root Directory → `backend`)
4. Railway подхватит `backend/Dockerfile`.
5. **Variables** (Settings → Variables) — добавь все:

| Variable | Пример / значение |
|----------|-------------------|
| `APP_ENV` | `production` |
| `DATABASE_URL` | строка из шага 1 (`postgresql+asyncpg://...&ssl=require`) |
| `SECRET_KEY` | из `gen_secrets.py` (≥48 символов) |
| `ADMIN_EMAIL` | твой email |
| `ADMIN_USERNAME` | например `siteadmin` |
| `ADMIN_PASSWORD` | сильный пароль (≥14, буквы+цифры+символ) |
| `ADMIN_DISPLAY_NAME` | `KeyMaster Admin` |
| `ADMIN_SYNC_PASSWORD` | `false` |
| `SEED_ON_STARTUP` | `true` |
| `CORS_ORIGINS` | пока `http://localhost:5173` — **обновишь после Vercel** |
| `TRUSTED_HOSTS` | hostname Railway (см. ниже) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `720` |

6. **Settings → Networking → Generate Domain**  
   Получишь URL вида: `https://keymaster-production-xxxx.up.railway.app`
7. В `TRUSTED_HOSTS` поставь хост **без** `https://`, например:  
   `keymaster-production-xxxx.up.railway.app`
8. Дождись деплоя → открой:  
   `https://ТВОЙ-RAILWAY-URL/health`  
   Должно быть: `{"status":"ok","env":"production"}`

API база для фронта:
```text
https://ТВОЙ-RAILWAY-URL/api
```

---

## 3. Vercel (frontend / React)

1. Зайди на [https://vercel.com](https://vercel.com) → **Add New Project** → импорт KeyMaster с GitHub.
2. Настройки проекта:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (по умолчанию)
   - **Output Directory:** `dist`
3. **Environment Variables:**

| Name | Value |
|------|-------|
| `VITE_API_BASE` | `https://ТВОЙ-RAILWAY-URL/api` |

4. Deploy.
5. Получишь URL вида: `https://keymaster-xxxx.vercel.app`

---

## 4. Связать фронт и API (CORS)

Вернись в **Railway → Variables** и обнови:

```text
CORS_ORIGINS=https://keymaster-xxxx.vercel.app
```

Если будет свой домен — добавь через запятую:

```text
CORS_ORIGINS=https://keymaster-xxxx.vercel.app,https://yourdomain.com
```

Redeploy backend (Railway сделает сам после сохранения переменных).

---

## 5. Проверка

1. Открой сайт на Vercel.
2. Зарегистрируй обычного пользователя **или** войди админом:
   - email = `ADMIN_EMAIL`
   - password = `ADMIN_PASSWORD`
3. Админка: `https://твой-vercel.vercel.app/admin`
4. Курсы/уроки должны грузиться (seed создаёт их при первом старте API).

---

## 6. Домен keymaster.pp.ua

Пошагово: **`docs/DOMAIN.md`**.

Кратко: Vercel → Domains → `keymaster.pp.ua` → DNS (A + CNAME www) → Railway `FRONTEND_URL` + `CORS_ORIGINS` → Supabase Site URL / redirect.

После смены `VITE_*` нужен **новый билд** на Vercel.

---

## Частые ошибки

| Проблема | Что делать |
|----------|------------|
| CORS error в браузере | `CORS_ORIGINS` = точный URL Vercel (с `https://`, без `/` в конце) |
| 502 / приложение не стартует | смотри логи Railway: часто слабый `SECRET_KEY` или SQLite в `DATABASE_URL` |
| `ssl` / connection refused к Neon | в URL есть `?ssl=require` и драйвер `postgresql+asyncpg://` |
| Фронт ходит на localhost | забыли `VITE_API_BASE` на Vercel → Redeploy |
| Admin не пускает | пароль слабый / не совпадает с `ADMIN_PASSWORD`; один раз `ADMIN_SYNC_PASSWORD=true`, потом снова `false` |
| Trusted Host rejected | `TRUSTED_HOSTS` = hostname Railway без протокола |

---

## Docker локально (не обязательно)

Если хочешь поднять всё у себя: см. `docker-compose.yml` + `docker-compose.prod.yml`.  
Для облака (Vercel/Railway/Neon) Docker на своём ПК не нужен.
