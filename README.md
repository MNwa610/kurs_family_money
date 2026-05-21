# Семейный бюджет

Веб-приложение для учёта семейных доходов и расходов: дашборд с KPI и графиками, список транзакций с фильтрами, отчёты и экспорт в CSV.

## Стек

| Часть | Технологии |
|-------|------------|
| Frontend | React 18, Vite, React Router, Recharts |
| Backend | Node.js, Express, Prisma |
| БД | PostgreSQL |
| Auth | JWT (Bearer) |

## Требования

- **Node.js** 18+
- **npm** 9+
- **PostgreSQL** 14+ (локально или через Docker)
- **Docker** и **Docker Compose** v2 — опционально, для БД и полного запуска в контейнерах

## Структура проекта

```
kurs_spo_family/
├── backend/          # REST API (Express + Prisma)
│   ├── prisma/       # схема БД и миграции
│   └── src/
├── frontend/         # SPA (React + Vite)
│   └── src/
├── docker-compose.yml
└── README.md
```

## Быстрый старт (локальная разработка)

### 1. База данных

**Вариант A — только PostgreSQL в Docker (удобно для разработки):**

```bash
docker compose up -d db
```

Контейнер слушает на хосте порт **5433** (не 5432), чтобы не мешать уже установленному PostgreSQL. В `backend/.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/family_budget?schema=public"
```

**Вариант B — локальный PostgreSQL уже запущен на 5432** — Docker для БД не нужен. Создайте базу `family_budget` и в `backend/.env` укажите свой логин/пароль:

```
DATABASE_URL="postgresql://ВАШ_ПОЛЬЗОВАТЕЛЬ:ВАШ_ПАРОЛЬ@localhost:5432/family_budget?schema=public"
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Отредактируйте DATABASE_URL и JWT_SECRET при необходимости

npm install
npm run db:generate
npm run db:migrate    # применить миграции
npm run dev           # http://localhost:3000
```

Проверка: [http://localhost:3000/health](http://localhost:3000/health) → `{"ok":true,...}`

### 3. Frontend

В отдельном терминале:

```bash
cd frontend
npm install
npm run dev           # http://localhost:5173
```

Vite проксирует запросы `/api` на backend (`http://localhost:3000`).

### 4. Первый вход

1. Откройте [http://localhost:5173](http://localhost:5173)
2. Нажмите **Зарегистрироваться** — создаётся пользователь, член семьи, счёт и категории по умолчанию
3. После входа доступны главная, транзакции и отчёты

### Установка всего из корня

```bash
npm run install:all
```

---

## Запуск через Docker (полный стек)

Поднимает PostgreSQL, API и собранный frontend (nginx на порту **8080**).

```bash
# из корня репозитория
cp .env.example .env   # задайте JWT_SECRET
docker compose up --build
```

| Сервис | URL |
|--------|-----|
| Приложение | http://localhost:8080 |
| API | http://localhost:3000/api |
| PostgreSQL (с хоста) | `localhost:5433` (логин/пароль из `.env`) |

Остановка:

```bash
docker compose down
```

Данные БД сохраняются в volume `postgres_data`. Удалить volume:

```bash
docker compose down -v
```

---

## Переменные окружения

### Backend (`backend/.env`)

| Переменная | Описание | Пример |
|------------|----------|--------|
| `DATABASE_URL` | Строка подключения PostgreSQL | `postgresql://postgres:postgres@localhost:5432/family_budget?schema=public` |
| `JWT_SECRET` | Секрет для подписи JWT | длинная случайная строка |
| `JWT_EXPIRES_IN` | Срок жизни токена | `7d` |
| `PORT` | Порт API | `3000` |

### Docker (корневой `.env`)

| Переменная | Описание |
|------------|----------|
| `JWT_SECRET` | Секрет для backend в контейнере |
| `POSTGRES_USER` | Пользователь БД (по умолчанию `postgres`) |
| `POSTGRES_PASSWORD` | Пароль БД |
| `POSTGRES_DB` | Имя базы (`family_budget`) |
| `POSTGRES_PORT` | Порт на хосте (по умолчанию `5433`) |

---

## NPM-скрипты

### Корень

| Команда | Действие |
|---------|----------|
| `npm run install:all` | Установка зависимостей backend и frontend |
| `npm run dev:backend` | Backend в режиме watch |
| `npm run dev:frontend` | Frontend (Vite) |
| `npm run docker:up` | `docker compose up --build` |
| `npm run docker:down` | Остановка контейнеров |
| `npm run docker:db` | Только PostgreSQL в Docker |

### Backend

| Команда | Действие |
|---------|----------|
| `npm run dev` | Запуск с hot-reload |
| `npm run start` | Продакшен-запуск |
| `npm run db:generate` | Генерация Prisma Client |
| `npm run db:migrate` | Миграции (dev) |
| `npm run db:push` | Синхронизация схемы без миграций |
| `npm run db:studio` | Prisma Studio (GUI для БД) |

### Frontend

| Команда | Действие |
|---------|----------|
| `npm run dev` | Dev-сервер |
| `npm run build` | Сборка в `dist/` |
| `npm run preview` | Просмотр production-сборки |

---


## Сборка для продакшена (без Docker)

```bash
cd frontend && npm run build
cd ../backend && npm run db:migrate && npm run start
```

Frontend раздавайте через nginx (прокси `/api` → backend) или используйте `docker compose up`.

---

