# KeyMaster

Современная платформа для изучения горячих клавиш (Windows, VS Code, браузеры, IDE и др.).

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS v4, Framer Motion, React Router, Zustand, TanStack Query |
| Backend | Python, FastAPI, PostgreSQL (prod) / SQLite (dev), SQLAlchemy async, JWT |

## Быстрый старт (dev)

### 1. Секреты и админ

Пароль админа **не зашит в код**. Создайте `backend/.env`:

```bash
cp backend/.env.example backend/.env
python scripts/gen_secrets.py
# вставьте SECRET_KEY и ADMIN_PASSWORD в backend/.env
# задайте ADMIN_EMAIL и ADMIN_USERNAME
```

Требования к паролю админа: ≥14 символов, заглавная, строчная, цифра, спецсимвол.

### 2. API

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

При старте создаются таблицы, seed курсов и админ из env.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Откройте http://localhost:5173 — Vite проксирует `/api` на `:8000`.  
Админка: `/admin` (после входа под `ADMIN_EMAIL`).

## Docker / продакшен

См. **[DEPLOY.md](./DEPLOY.md)** — compose, Railway/Vercel, ротация пароля, security checklist.

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Основные разделы

- `/` — landing  
- `/register`, `/login` — JWT  
- `/dashboard`, `/path`, `/courses`  
- `/training`, `/speed`, `/exam`  
- `/leaderboard`, `/achievements`, `/stats`  
- `/admin` — полноценная админка (только `is_admin`)

## Безопасность (кратко)

- Production: только PostgreSQL, сильный `SECRET_KEY`, admin из env  
- Rate-limit на auth/admin, security headers, `/docs` выключен в prod  
- Регистрация не может выдать `is_admin`
