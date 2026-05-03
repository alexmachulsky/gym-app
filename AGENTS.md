# AGENTS.md

This file provides guidance to AI coding agents working in this repository.

Smart Gym Progress Tracker — full-stack fitness-analytics SaaS app. React + Vite frontend, FastAPI backend, PostgreSQL database, Docker Compose local stack, AWS EKS deployment.

## Commands

### Full stack (recommended)
```bash
cp .env.example .env   # first time only — set SECRET_KEY
docker compose up --build
```
Services: frontend `http://localhost:5173`, backend `http://localhost:8000`, Swagger `http://localhost:8000/docs`

### Backend tests
```bash
cd backend
pytest -q
pytest tests/unit/
pytest tests/integration/
pytest tests/unit/test_auth_service.py
pytest tests/unit/test_auth_service.py::test_hash_password
```
Tests use an in-memory SQLite database configured in `backend/tests/conftest.py`, so a running Postgres instance is not required.

### Frontend
```bash
cd frontend
npm ci
npm run dev     # dev server on port 5173 — requires backend running separately
npm run build   # production build
node --test tests/exercise-image-catalog.test.mjs  # unit tests (Node built-in runner, not Jest/Vitest)
npx playwright test  # E2E tests (requires running stack)
```
When running `npm run dev` without Docker, set `VITE_API_BASE_URL=http://localhost:8000` — the default `/api` only works when nginx is proxying.

### Backend-only development
```bash
cd backend
alembic upgrade head
uvicorn app.main:app --reload
```

### Database migrations
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Kubernetes manifest validation
```bash
kubectl kustomize k8s/base >/dev/null
```

## Architecture

### Repository layout
- `backend/app/` — FastAPI application: `routes/`, `services/`, `models/`, `schemas/`, `core/`, `utils/`.
- `backend/alembic/` — database migrations.
- `backend/tests/unit/` and `backend/tests/integration/` — backend test coverage.
- `frontend/src/` — React SPA: `pages/`, `components/`, `api/`, `data/`, `hooks/`, `utils/`.
- `k8s/base/` — Kubernetes manifests. `infra/terraform/aws/` — AWS infrastructure. See `k8s/README.md` for EKS deployment guide.

### Backend (`backend/`)
FastAPI uses a layered structure: **route → service → database query**. Route handlers are thin; services own all business logic.

**Routes** (`app/routes/`): `/auth`, `/exercises`, `/workouts`, `/body-metrics`, `/progress`, `/templates`, `/goals`, `/ai-coach`, `/billing`, `/admin`, `/settings`, `/export`, `/equipment-profiles`, `/health`.

**Services** (`app/services/`): `AuthService`, `WorkoutService`, `BodyMetricService`, `ProgressionService`, `TemplateService`, `GoalService`, `AIService`, `BillingService`, `AdminService`, `UserPreferenceService`, `EquipmentProfileService`, `EmailService`, `GeneratorService`. **Services raise `HTTPException` directly** — routes never catch or re-raise service exceptions. Use 404 for missing owner-scoped resources, 409 for conflicts, 400 for validation/permission violations.

**Models** (`app/models/`): `User`, `Exercise`, `Workout`, `WorkoutSet`, `BodyMetric`, `WorkoutTemplate`, `Goal`, `EquipmentProfile`, `Subscription`, `UserPreference`, `PasswordResetToken`, `EmailVerificationToken`. All PKs are UUIDs.

**Schemas** (`app/schemas/`): Pydantic request/response models separate from ORM models. Validation uses `field_validator` (date max=today, weight ≤ 1000, reps 1–200, sets 1–100, password complexity). **All response schemas require `model_config = ConfigDict(from_attributes=True)`** — omitting it causes runtime validation errors.

**Core** (`app/core/`): `config.py` (pydantic-settings, reads `.env`), `database.py` (engine + `get_db` dependency), `security.py` (JWT + bcrypt + refresh tokens), `logging.py`, `limiter.py` (slowapi — kept separate from `main.py` to avoid circular imports).

**Dependencies** (`app/utils/deps.py`): `get_current_user` (validates JWT, returns `User` ORM object with eager-loaded subscription), `require_pro` (gates pro-tier features; also grants access during active trial), `require_admin`, `require_not_impersonating` (block sensitive actions during admin impersonation), `check_free_limit` (enforces free-tier limits: exercises=10, templates=3, goals=2; does `SELECT FOR UPDATE` on User row), `get_user_limits`.

**Auth flow**: Dual JWT tokens — `access_token` (60 min) + `refresh_token` (30 days). Frontend stores both in `localStorage`, sends access token as `Authorization: Bearer <token>`, and auto-retries with `POST /auth/refresh` on 401. `token_version` claim in JWT — incrementing it (e.g., on password change) invalidates all existing tokens synchronously.

**CSRF**: Double-submit cookie pattern — every state-changing request (`POST`/`PUT`/`PATCH`/`DELETE`) requires an `X-CSRF-Token` header that matches the `csrf_token` cookie. Exempt: `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/billing/webhook`.

**Rate limiting**: `/auth/register` and `/auth/login` capped at 5 req/minute per IP. AI routes: 10/min. Export: 3/min. Account lockout after 5 failed logins (15-min `locked_until`).

**SQLAlchemy conventions**: Use `joinedload` for related collections to avoid N+1 queries. Call `db.flush()` before `db.refresh()` when the refreshed object depends on cascade-populated fields. All model files require `from __future__ import annotations` (lazy evaluation for SQLAlchemy 2.0 `Mapped[]` forward references — do not remove). `from app.models import *` in `conftest.py` is required to register all models before `create_all()` — do not remove the star import.

### Frontend (`frontend/src/`)
React SPA built with Vite and plain JavaScript (no TypeScript):

**API layer** — `api/client.js`: single axios instance with JWT header injection, refresh-token auto-retry logic, and queued request replay during refresh.

**Routing** — `App.jsx`: wraps routes in `<ToastProvider>` and `<SubscriptionProvider>`. Public routes: `/`, `/pricing`, `/terms`, `/privacy`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`. Protected routes wrap in `<ProtectedRoute><Layout />` and include `/exercises`, `/workouts`, `/body-metrics`, `/progress`, `/templates`, `/goals`, `/ai-coach`, `/settings`, `/admin`.

**Key components**: `Layout.jsx` (app shell with `pageViewByPath` map for per-route banners), `ProtectedRoute.jsx`, `ConfirmDialog.jsx`, `EmptyState.jsx`, `FeatureGate.jsx`, `UpgradeBanner.jsx`, `ProBadge.jsx`, `UsageMeter.jsx`, `ActiveWorkout.jsx`, `RestTimer.jsx`, `GenerateWorkoutModal.jsx`, `ExerciseDetailModal.jsx`, `ExerciseSwapModal.jsx`, `WorkoutShareCard.jsx`, `PublicLayout.jsx`. Files named `*.figma.jsx` (e.g., `FeatureGate.figma.jsx`) are Figma Code Connect stubs — dev-only, not imported at runtime.

**Hooks**: `useToast.jsx` (global toast notifications — `addToast(message, severity)`; severities: `success`, `error`, `info`; auto-dismiss 4s), `useSubscription.jsx` (exposes `isPro` [paid OR active trial], `isPaidPro` [paid only], `isOnTrial`, `trialDaysLeft`, `limits`).

**Page patterns**: Pages own local state, use `useToast()` for all API feedback (never local error/notice state), track `isLoading`/`isSubmitting` for async actions, use `touched` object for field-level validation, extract errors with `err.response?.data?.detail || 'Fallback message'`.

**Charts**: `recharts` — `BodyMetricsPage` renders a `LineChart` for weight history; `ProgressPage` renders a `BarChart` for volume and estimated 1RM.

### Progression logic (`backend/app/services/progression_service.py`)
- Volume = `weight × reps × sets`
- Estimated 1RM = `weight × (1 + reps / 30)`
- Plateau = last 3 sessions show no strict increase in either metric

### Infrastructure
- **Docker Compose** — postgres → backend (health-checked) → frontend (nginx, port 5173→80).
- **nginx** (`frontend/nginx.conf`) — security headers (CSP, X-Frame-Options, Referrer-Policy), gzip at `gzip_comp_level 6` (`gzip_level` is invalid), 1-year immutable cache for hashed JS/CSS, no-cache for HTML. `/api/` proxies to backend container.
- **CI/CD** (`.github/workflows/`): `ci.yml` runs tests + build checks; `publish-images.yml` pushes to GHCR on `main`; `deploy-k8s.yml` is a manual EKS deploy workflow.
- **Deployment**: `infra/terraform/aws/` for EKS infrastructure, `k8s/base/` for manifests. `k8s/base/app-secrets.yaml` is gitignored — use `app-secrets.yaml.example` as template.

## Key Conventions

- Route handler → service method → database query. No SQLAlchemy queries in route handlers.
- Access settings via `from app.core.config import settings`.
- `get_db` is a FastAPI dependency yielding a SQLAlchemy `Session`; tests override via `app.dependency_overrides[get_db]`.
- `psycopg` v3, not `psycopg2`. Connection strings: `postgresql+psycopg://`.
- Import limiter from `app.core.limiter`, not `app.main` (circular import risk).
- Python: 4-space indentation, snake_case modules. React: 2-space indentation, PascalCase components, camelCase utilities.
- Hooks with JSX must use `.jsx` extension.
- When adding a page/route, add an entry to `pageViewByPath` in `components/Layout.jsx` for the banner title, subtitle, and photo.
- Use `useToast()` for all user-facing feedback — never local `error`/`notice` state.
- Pro features gated with `require_pro()` dependency; free-tier limits via `check_free_limit()`.
- Logout in `Layout.jsx` only removes `access_token`; `redirectToLogin()` in `api/client.js` removes both tokens.
- Default `SECRET_KEY = "change-me-in-production"` logs a `CRITICAL` warning on startup.
- No formatter or linter configuration is checked in. Match surrounding code style.

## Testing and Delivery

- Name test files `test_<feature>.py`. Unit tests in `tests/unit/`, integration in `tests/integration/`.
- Always call `app.dependency_overrides.clear()` after integration tests. `db_session` fixture uses `scope='function'` — schema recreated per test.
- `pytest` is in `requirements.txt` (no separate dev-requirements).
- `conftest.py` sets `SECRET_KEY` via `os.environ.setdefault` **before any app import** — importing `app.main` first will trigger the CRITICAL warning or key validation failure.
- New service logic and regression-prone API changes should ship with tests.
- Keep commits focused. Short, imperative commit subjects.
- PRs: describe user-facing change, list local validation steps, link issues, include screenshots for UI work.
- If deployment assets change, note `.env`/Terraform/Kubernetes follow-up in the PR.

## Common Pitfalls

| Pitfall | Correct approach |
|---------|------------------|
| JWT library | Use `python-jose[cryptography]` → `from jose import jwt`. NOT `PyJWT`. |
| bcrypt version | `bcrypt==4.0.1` is pinned — newer versions break `passlib`. |
| AI service HTTP client | `AIService` calls Groq via direct `httpx` requests — there is no `groq` pip package. |
| psycopg driver | `psycopg` v3 (not v2). Connection strings: `postgresql+psycopg://` not `postgresql+psycopg2://`. |
| `WorkoutSet.sets` | `sets` is a DB column (rep-set count). `Workout.workout_sets` is the ORM relationship (list of `WorkoutSet`). |
| `workout_to_response()` | Module-level function in `workout_service.py`, not a method on `WorkoutService`. |
| SQLite test pool | Use `StaticPool` + `check_same_thread: False` — never add `pool_size`/`max_overflow` to the test engine. |
| AI route handlers | `AIService._call_llm` is `async def` — AI route handlers must also be `async def`. |
