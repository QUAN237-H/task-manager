# Task Manager

Small full-stack task app built for the Cova recruitment test. You can sign up, log in, and manage your own tasks from the web app (and a Flutter mobile client that hits the same API).

Repo: https://github.com/QUAN237-H/task-manager

---

## What’s in here

| Folder | What it is |
|--------|------------|
| `backend/` | Spring Boot API (JWT auth + task CRUD + MySQL) |
| `frontend/` | React + Vite + TypeScript + Tailwind web UI |
| `mobile/` | Flutter app using the same API |
| `docker-compose.yml` | One-command local stack (MySQL + API + web) |
| `.github/workflows/ci.yml` | Build, test, Docker images (optional Cloud Run deploy) |

---

## How to run it

### Option A — Docker Compose (easiest)

You need Docker Desktop running.

```bash
docker compose up --build
```

Then open:

- Web: http://localhost:3000  
- API: http://localhost:8080  

Default MySQL inside Compose is already wired for the backend. Stop with `Ctrl+C`, or `docker compose down`.

### Option B — Run pieces locally

**1. MySQL**

Create a database named `taskmanager`. The backend defaults to:

- URL: `jdbc:mysql://localhost:3306/taskmanager`
- User / password: `root` / `root`  

(Change these via env vars if your MySQL setup is different — see `backend/src/main/resources/application.yml`.)

**2. Backend**

```bash
cd backend
mvn spring-boot:run
```

API listens on http://localhost:8080

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

Web UI: http://localhost:5173  

No `.env` file needed for local work — Vite proxies `/api` to the backend.

**4. Mobile (optional)**

```bash
cd mobile
flutter pub get
flutter run
```

Point the API base URL in the Flutter code at your machine (emulator often uses `10.0.2.2:8080`, a real phone needs your LAN IP).

---

## How it’s put together

Pretty straightforward monorepo:

```
Browser / Flutter  →  Spring Boot (/api/...)  →  MySQL
                         ↑ JWT on protected routes
```

**Auth**

- `POST /api/auth/register` — create account  
- `POST /api/auth/login` — get a JWT  
- Token goes in `Authorization: Bearer …` (web stores it in `localStorage`)

**Tasks** (logged-in user only)

- `GET /api/tasks` — list (supports status filter + search on the client)  
- `POST /api/tasks` — create  
- `PUT /api/tasks/{id}` — update  
- `DELETE /api/tasks/{id}` — delete  

**Why these choices**

- **Spring Boot + JPA + JWT** — matches the brief, keeps auth and CRUD in one clean API.  
- **React + Vite + TS + Tailwind** — fast UI iteration, typed API client, modern layout (desktop kanban + mobile list).  
- **Flutter** — same JWT and endpoints so web and mobile stay in sync.  
- **Docker Compose + GitHub Actions** — reproducible local run and CI that actually runs Maven tests + frontend typecheck/build. Cloud Run deploy is wired but optional (needs GCP secrets).

---

## Screenshots

Drop images into `docs/screenshots/` and they’ll show up below.

### What to capture

1. **Login (or register)** — the auth screen, so they see the entry point.  
2. **Dashboard / task list** — after login, with a few tasks visible (ideally filter or search in the shot).  
3. **Mobile** — Flutter app *or* the web UI at phone width; same idea: list of tasks.

Suggested filenames:

- `docs/screenshots/login.png`  
- `docs/screenshots/dashboard.png`  
- `docs/screenshots/mobile.png`  

<!-- Uncomment once the files exist:

![Login](docs/screenshots/login.png)

![Dashboard](docs/screenshots/dashboard.png)

![Mobile](docs/screenshots/mobile.png)

-->

---

## CI / deploy (bonus)

On every push to `main`, GitHub Actions:

1. Runs backend tests (`mvn test`)  
2. Typechecks + builds the frontend  
3. Builds Docker images  

Cloud Run deploy only runs if you set `ENABLE_GCP_DEPLOY=true` and the GCP/DB secrets on the repo. Until then, CI is build + test only.

---

## Quick smoke test

1. Register a user on the web UI  
2. Create a couple of tasks, change status, search  
3. Log in on Flutter with the same account — tasks should match  

That’s the whole loop.
