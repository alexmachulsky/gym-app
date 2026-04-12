# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Smart Gym Progress Tracker (ForgeMode) — full-stack fitness-analytics SaaS. React + Vite frontend, FastAPI backend, PostgreSQL, Docker Compose local stack, AWS EKS deployment.

## Commands

### Full stack (recommended)
```bash
cp .env.example .env   # first time only — set SECRET_KEY
docker compose up --build
```
Services: frontend `http://localhost:5173`, backend `http://localhost:8000`, Swagger `http://localhost:8000/docs`

### Production overlay
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
Enforces required secrets, sets `LOG_LEVEL: WARNING`, adds resource limits, and removes published host ports.

### Backend tests
```bash
cd backend
pytest -q
pytest tests/unit/
pytest tests/integration/
pytest tests/unit/test_auth_service.py
pytest tests/unit/test_auth_service.py::test_hash_password
```
Tests use in-memory SQLite (configured in `backend/tests/conftest.py`) — no running Postgres needed.

### Frontend
```bash
cd frontend && npm ci
npm run dev     # dev server port 5173; set VITE_API_BASE_URL=http://localhost:8000 without Docker
npm run build
```

### Backend-only
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

### Backend (`backend/app/`)
Layered: **route → service → database query**. Route handlers are thin; services own all business logic.

**Routes** (`app/routes/`): `/auth`, `/exercises`, `/workouts`, `/body-metrics`, `/progress`, `/templates`, `/goals`, `/ai-coach`, `/billing`, `/admin`, `/settings`, `/export`, `/equipment-profiles`, `/health`, `/achievements`, `/social`, `/organizations`, `/notifications`, `/api/v1` (public API with API key auth).

**Services** (`app/services/`): `AuthService`, `WorkoutService`, `BodyMetricService`, `ProgressionService`, `TemplateService`, `GoalService`, `AIService`, `BillingService`, `AdminService`, `UserPreferenceService`, `EquipmentProfileService`, `EmailService`, `GeneratorService`. **Services raise `HTTPException` directly** — routes never catch or re-raise. Use 404 for missing owner-scoped resources, 409 for conflicts, 400 for validation/permission violations.

**Models** (`app/models/`): 23 SQLAlchemy models including `User`, `Exercise`, `Workout`, `WorkoutSet`, `BodyMetric`, `WorkoutTemplate`, `Goal`, `EquipmentProfile`, `Subscription`, `UserPreference`, `PasswordResetToken`, `EmailVerificationToken`. All PKs are UUIDs. `User` has `onboarding_completed` (bool), `trial_ends_at` (datetime, nullable), and `last_active_at` (datetime, nullable).

**Schemas** (`app/schemas/`): Pydantic request/response models separate from ORM models. Validation uses `field_validator` (date max=today, weight ≤ 1000, reps 1–200, sets 1–100, password complexity). **All response schemas require `model_config = ConfigDict(from_attributes=True)`** — omitting it causes runtime validation errors.

**Core** (`app/core/`): `config.py` (pydantic-settings, reads `.env`), `database.py` (engine + `get_db` dependency), `security.py` (JWT + bcrypt + refresh tokens), `logging.py`, `limiter.py` (slowapi — kept separate from `main.py` to avoid circular imports).

**Dependencies** (`app/utils/deps.py`): `get_current_user` (validates JWT, returns `User` ORM object with eager-loaded subscription), `require_pro`, `require_admin`, `check_free_limit` (free-tier: exercises=10, templates=3, goals=2), `get_user_limits` (returns per-resource usage + limits dict). `_user_has_pro_access()` checks both `subscription_tier == 'pro'` **and** active trial (`trial_ends_at > now`), so `require_pro` grants access during trial too.

**Auth**: Dual JWT — `access_token` (60 min) + `refresh_token` (30 days). Frontend stores both in `localStorage`, auto-retries with `POST /auth/refresh` on 401. CSRF uses double-submit cookie + `X-CSRF-Token` header; auth endpoints and Stripe webhooks are exempt.

**Rate limiting**: `/auth/register` and `/auth/login` capped at 5 req/min per IP. AI routes: 10/min; export: 3/min. Account lockout after 5 failed login attempts (15-min lock). Max 3 password reset tokens per user per hour.

**SQLAlchemy**: Use `joinedload` for related collections to avoid N+1 queries. Call `db.flush()` before `db.refresh()` when the refreshed object depends on cascade-populated fields. Use `postgresql+psycopg://` (psycopg v3, not v2).

**External integrations**: Groq (AI Coach), Stripe (billing + webhooks with idempotency), Resend (transactional email), Sentry (error monitoring), Prometheus via `fastapi-instrumentator`.

### Frontend (`frontend/src/`)
React SPA, Vite, plain JavaScript (no TypeScript), 2-space indentation, PascalCase components.

**API layer** — `api/client.js`: axios instance with JWT injection, refresh-token auto-retry, and queued request replay during refresh.

**Routing** — `App.jsx`: wraps in `<ToastProvider>` and `<SubscriptionProvider>`. Public routes: `/`, `/pricing`, `/terms`, `/privacy`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`. Protected routes wrap in `<ProtectedRoute><Layout />`.

**Key components**: `Layout.jsx` (app shell with `pageViewByPath` map for per-route banners), `ProtectedRoute.jsx`, `ConfirmDialog.jsx`, `EmptyState.jsx`, `FeatureGate.jsx`, `UpgradeBanner.jsx`, `ProBadge.jsx`, `UsageMeter.jsx`, `ActiveWorkout.jsx`, `RestTimer.jsx`, `GenerateWorkoutModal.jsx`, `ExerciseDetailModal.jsx`, `ExerciseSwapModal.jsx`, `WorkoutShareCard.jsx`, `Skeleton.jsx`, `Confetti.jsx`.

**Page patterns**: Use `useToast()` for all user-facing feedback (never local `error`/`notice` state). Track `isLoading`/`isSubmitting` for async actions. Use `touched` object for field-level validation. Extract errors with `err.response?.data?.detail || 'Fallback message'`.

**Hooks**: `useToast.jsx` — `addToast(message, severity)`; severities: `success`, `error`, `info`; auto-dismiss 4s. `useKeyboardShortcuts(shortcuts)` — registers global key listeners (ignores inputs/textareas). `useCountUp` — animated number counter.

**Subscription context** (`useSubscription`): exposes `isPro`, `isOnTrial`, `trialDaysLeft`, `trialEndsAt`, `limits`, `refresh`. Fetches `/billing/status`, `/billing/limits`, and `/auth/me` on mount.

**Onboarding**: `OnboardingWizard` (4-step modal) shown to new users until `user.onboarding_completed = true`. Calls `PUT /auth/profile` with `{ onboarding_completed: true }` on finish or skip.

**Charts**: `recharts` — `BodyMetricsPage` uses `LineChart`, `ProgressPage` uses `BarChart`.

### Progression logic (`backend/app/services/progression_service.py`)
- Volume = `weight × reps × sets`
- Estimated 1RM = `weight × (1 + reps / 30)`
- Plateau = last 3 sessions show no strict increase in either metric

### Infrastructure
- **Docker Compose**: postgres → backend (health-checked) → frontend (nginx, port 5173→80).
- **nginx** (`frontend/nginx.conf`): security headers (CSP, X-Frame-Options, HSTS, Referrer-Policy), gzip at `gzip_comp_level 6` (`gzip_level` is invalid), 1-year immutable cache for hashed assets, no-cache for HTML, `/api/` proxies to backend. `/api/metrics` is blocked.
- **CI/CD** (`.github/workflows/`): `ci.yml` runs tests + build + k8s validation + compose smoke test; `publish-images.yml` pushes to GHCR on `main`; `deploy-k8s.yml` is a manual EKS deploy workflow.
- **Kubernetes** (`k8s/base/`): 2-replica Deployments with HPA (2–10 replicas, 70% CPU), PostgreSQL StatefulSet with 10Gi PVC, TLS Ingress via cert-manager, NetworkPolicies (default deny), pod security standards (enforce: baseline).
- `k8s/base/app-secrets.yaml` is gitignored — use `app-secrets.yaml.example` as template.

## Key Conventions

- No SQLAlchemy queries in route handlers — service layer only.
- Access settings via `from app.core.config import settings`.
- Import limiter from `app.core.limiter`, not `app.main` (circular import risk).
- Python: 4-space indentation, snake_case modules. React: 2-space indentation, PascalCase components.
- Hooks with JSX must use `.jsx` extension.
- When adding a page/route, add an entry to `pageViewByPath` in `components/Layout.jsx` for the banner title, subtitle, and photo.
- Pro features gated with `require_pro()` dependency (also grants access during active trial); free-tier limits via `check_free_limit()`; admin-only routes use `require_admin()`.
- Admin impersonation tokens last 15 minutes; use `require_not_impersonating` to block sensitive actions.
- Logout in `Layout.jsx` only removes `access_token`; `redirectToLogin()` in `api/client.js` removes both tokens.
- Default `SECRET_KEY = "change-me-in-production"` logs a `CRITICAL` warning on startup.

## Testing

- Unit tests in `tests/unit/`, integration in `tests/integration/`. Name files `test_<feature>.py`.
- Always call `app.dependency_overrides.clear()` after integration tests. `db_session` fixture uses `scope='function'` — schema recreated per test.
- `pytest` is in `requirements.txt` (no separate dev-requirements).
