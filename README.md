# ForgeMode

> Train with clarity. Improve with data.

ForgeMode is a full-stack fitness analytics SaaS app for lifters who want more than a plain workout log. It combines a React + Vite SPA, a FastAPI backend, PostgreSQL persistence, Docker Compose local development, and AWS EKS deployment assets in one repo.

[![CI](https://github.com/alexmachulsky/gym-app/actions/workflows/ci.yml/badge.svg)](https://github.com/alexmachulsky/gym-app/actions/workflows/ci.yml)
[![Publish Docker Images](https://github.com/alexmachulsky/gym-app/actions/workflows/publish-images.yml/badge.svg)](https://github.com/alexmachulsky/gym-app/actions/workflows/publish-images.yml)
[![Deploy to EKS](https://github.com/alexmachulsky/gym-app/actions/workflows/deploy-k8s.yml/badge.svg)](https://github.com/alexmachulsky/gym-app/actions/workflows/deploy-k8s.yml)

## Why This Repo Is Interesting

ForgeMode is built as a product, not just a CRUD demo:

- Public marketing pages and an authenticated app shell live in the same frontend
- JWT auth uses dual tokens (access + refresh) with token-version revocation, refresh rotation, account lockout, and CSRF protection
- The backend follows a strict route → service → database-query layered architecture across 19 route modules and 14 service classes
- Free and Pro tiers are enforced in the application layer with metered limits and feature gates, not just in UI copy
- A 4-step onboarding wizard personalizes setup for new users with preferences, starter exercises, and goals
- Social features (follow/share), achievements, organizations, a public API with key auth, and webhook endpoints are all wired in
- AI coaching, billing with Stripe, transactional email, export, admin with impersonation, and equipment profiles round out the platform surface
- The project ships with Docker Compose for local dev, a production overlay, and full EKS-ready deployment assets including HPA, network policies, TLS ingress, and Terraform

## Experience At A Glance

| Landing page | Workout command center |
|---|---|
| ![ForgeMode landing page](docs/images/readme-home.png) | ![ForgeMode workout dashboard](docs/images/readme-workouts.png) |

The current UI uses a dark, neon-lime visual system across the public site, auth flows, and the logged-in training dashboard.

## What ForgeMode Does

### For users

- Log workouts with set-level detail, notes, effort, and rest timers
- Browse a curated library of 83 exercises across 12 categories with Pexels-sourced images
- Add custom exercises on top of the built-in catalog
- Track body metrics (weight, body fat, muscle mass) over time with line charts
- Analyze progression with volume, estimated 1RM, and plateau detection
- Save workout templates, set training goals, and manage preferences
- Earn achievements for milestones like workout streaks and volume records
- Follow other users, share workouts with expiring public links, and set a public profile
- Create or join organizations (trainer or gym tier) with member management
- Upgrade into AI Coach, advanced analytics, export, and equipment profile workflows
- Walk through a 4-step onboarding wizard that sets units, picks starter exercises, and defines goals

### For developers

- React + Vite frontend with a centralized Axios client, token refresh queue, and 22 reusable components
- FastAPI service layer with 23 SQLAlchemy models, 14 services, and Alembic migrations
- Dual JWT auth with token versioning, CSRF double-submit cookies, account lockout, and admin impersonation
- Owner-scoped resource handling, Pro gates, trial-aware access checks, and free-tier limits
- Public REST API (v1) with API key authentication and webhook endpoint registration
- Prometheus metrics, structured logging, Sentry integration, and health/readiness probes
- Docker Compose local stack with a production overlay, plus full Kubernetes manifests
- GitHub Actions pipelines for tests, builds, image publishing, and EKS deployment
- Terraform modules for AWS VPC, EKS, RDS, WAF, and CDN

## Product Areas

| Area | What you get |
|---|---|
| Authentication | Register, login, logout (token revocation), refresh with rotation, verify email, forgot/reset password, account lockout after 5 failed attempts |
| Onboarding | 4-step wizard: unit preferences, starter exercises, primary goal, review and launch |
| Workout Tracking | Session logging, rest timer, workout generator, active workout utilities, workout history |
| Exercise Library | 83 built-in exercises across 12 categories with curated images, plus custom exercise creation |
| Body Metrics | Weight, body fat, and muscle mass tracking with trend charts |
| Progress Analytics | Volume, estimated 1RM, charting, plateau detection |
| Templates & Goals | Reusable workout templates and training goals |
| Achievements | 10 achievement types including streaks, milestones, and body recomposition |
| Social | Public profiles, follow/unfollow, shared workout links with 30-day expiry |
| Organizations | Trainer and gym tiers with member invites, roles (owner/trainer/member), and caps |
| AI Coach | Coaching, parsing, and workout-assistance routes and UI |
| Public API | v1 REST API with API key auth, webhook endpoint management |
| Billing | Stripe checkout, customer portal, coupon validation, cancel feedback, webhook processing |
| Admin | User management, impersonation, business metrics, segments, funnel analytics, audit logging |
| Notifications | Web Push subscription management (storage layer) |
| Infrastructure | Export, equipment profiles, settings, health/readiness probes, Prometheus metrics |

## Free vs Pro Model

The backend enforces these limits and feature gates. Active trials grant Pro-level access.

| Capability | Free | Pro |
|---|---:|---:|
| Custom exercises | Up to 10 | Unlimited |
| Workout templates | Up to 3 | Unlimited |
| Goals | Up to 2 | Unlimited |
| AI Coach | No | Yes |
| Export | No | Yes |
| Equipment profiles | No | Yes |
| Advanced charts | No | Yes |
| Workout generator | No | Yes |

## Architecture

```mermaid
flowchart LR
    A[React + Vite SPA] -->|JWT + refresh retry| B[FastAPI API]
    B --> C[Service layer]
    C --> D[(PostgreSQL)]
    B --> E[Stripe billing]
    B --> F[Groq AI]
    B --> G[Resend email]
    B --> H[Sentry monitoring]
    B --> I[Prometheus metrics]
```

The backend stays disciplined: routes stay thin, services own business logic, and schemas stay separate from ORM models. On the frontend, a single Axios client injects tokens, handles refresh, and retries queued requests after re-authentication. CSRF protection uses a double-submit cookie pattern for all mutating requests.

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React 18, Vite 6, React Router 6, Axios, Recharts |
| Backend | Python 3.11, FastAPI, SQLAlchemy 2, Alembic, Pydantic Settings |
| Auth & Security | JWT (python-jose), bcrypt/passlib, refresh tokens, token versioning, CSRF double-submit, slowapi rate limiting, account lockout |
| Database | PostgreSQL 16, psycopg v3 |
| AI | Groq-backed service hooks |
| Payments | Stripe (Checkout, Customer Portal, webhooks with idempotency) |
| Email | Resend transactional email |
| Observability | Prometheus (fastapi-instrumentator), structured logging, health/readiness probes, Sentry |
| Testing | pytest unit and integration suites (in-memory SQLite) |
| Delivery | Docker Compose (dev + prod), GitHub Actions, GHCR, Terraform (VPC, EKS, RDS, WAF, CDN), Kubernetes |

## Quick Start

### Recommended: full stack with Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Open the stack at:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

Set a real `SECRET_KEY` in `.env` before doing anything beyond local experimentation. The default development value logs a critical warning on startup for a reason.

### Production overlay

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

The production overlay enforces required secrets (`SECRET_KEY`, `POSTGRES_PASSWORD`), sets `LOG_LEVEL: WARNING`, adds resource limits (backend 512M/1 CPU, frontend 128M/0.5 CPU), removes published host ports (use a reverse proxy), and wires in optional Stripe, Resend, Groq, and Sentry integrations.

## Local Development

### Backend only

```bash
cd backend
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend only

```bash
cd frontend
npm ci
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

When the frontend runs outside Docker, set `VITE_API_BASE_URL=http://localhost:8000`. The default `/api` path only works when nginx is proxying requests in the composed stack.

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

## Security

| Feature | Implementation |
|---|---|
| Authentication | Dual JWT (access 60 min + refresh 30 days), token-version revocation on logout/password change |
| CSRF | Double-submit cookie + `X-CSRF-Token` header; exempt paths for auth endpoints and Stripe webhooks |
| Rate limiting | Per-endpoint limits (5–30 req/min on auth, 10/min on AI, 3/min on export) keyed by user or IP |
| Account lockout | 5 failed login attempts → 15-minute lock |
| Password reset | Max 3 reset tokens per user per hour |
| Admin impersonation | Short-lived 15-minute tokens; `require_not_impersonating` blocks sensitive actions |
| Secrets | `k8s/base/app-secrets.yaml` is gitignored; optional External Secrets Operator support |
| nginx | CSP, X-Frame-Options DENY, HSTS, Referrer-Policy, `/api/metrics` blocked |

## How Progress Is Calculated

Progression logic lives in `backend/app/services/progression_service.py`.

- `volume = weight × reps × sets`
- `estimated_1RM = weight × (1 + reps / 30)`
- Plateau detection flags cases where the last 3 sessions fail to show a strict increase in either signal

## Testing

### Backend

```bash
cd backend
pytest -q
pytest tests/unit/
pytest tests/integration/
```

Backend tests use an in-memory SQLite database configured in `backend/tests/conftest.py`, so local Postgres is not required for test runs.

### Frontend production build

```bash
cd frontend
npm ci
npm run build
```

## Deployment Story

### Local (Docker Compose)

- `postgres` → `backend` (health-checked) → `frontend` (nginx with security headers, gzip, SPA fallback, `/api/` reverse proxy)
- Production overlay available via `docker-compose.prod.yml` with resource limits and required secrets

### CI/CD

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | Push/PR to main | Backend tests, frontend build, K8s manifest validation, Docker build verification, compose smoke test |
| `publish-images.yml` | Push to main or manual | Builds and pushes backend + frontend images to GHCR with SHA and latest tags |
| `deploy-k8s.yml` | Manual | OIDC AWS auth, `kubectl apply -k`, image update, rollout wait |

### Kubernetes

Manifests in `k8s/base/` include:

- Backend and frontend Deployments (2 replicas each) with resource requests/limits
- HPA for the backend (2–10 replicas, 70% CPU target)
- StatefulSet for PostgreSQL with a 10Gi PVC
- Ingress with TLS via cert-manager (Let's Encrypt)
- NetworkPolicies (default deny, scoped ingress rules)
- Namespace with pod security standards (enforce: baseline, warn: restricted)

### Infrastructure as Code

- Terraform modules: `infra/terraform/aws/` — VPC, EKS, RDS, WAF, CDN
- Deployment guide: `k8s/README.md`

## API Surface

The backend exposes 19 route modules:

| Group | Prefix | Key endpoints |
|---|---|---|
| Health | `/health` | Liveness, readiness |
| Auth | `/auth` | Register, login, logout, refresh, profile, verify email, password flows |
| Billing | `/billing` | Status, limits, Stripe checkout/portal/webhooks, coupons, cancel feedback |
| Exercises | `/exercises` | CRUD with free-tier limit |
| Workouts | `/workouts` | Session logging and history |
| Body Metrics | `/body-metrics` | Weight, body fat, muscle mass tracking |
| Progress | `/progress` | Volume, 1RM, plateau analysis |
| Templates | `/templates` | Reusable workout templates |
| Goals | `/goals` | Training goals |
| Settings | `/settings` | User preferences |
| Export | `/export` | Data export (Pro) |
| Equipment | `/equipment-profiles` | Equipment configurations (Pro) |
| AI Coach | `/ai` | AI coaching and assistance |
| Achievements | `/achievements` | Unlocked achievements, catalog, check triggers |
| Social | `/social` | Profiles, follow/unfollow, workout sharing |
| Organizations | `/organizations` | Create, list, invite, manage members |
| Notifications | `/notifications` | Push subscription management |
| Admin | `/admin` | Stats, metrics, users, impersonation, audit log |
| Public API | `/api/v1` | API keys, workouts, exercises, webhooks (key-based auth) |

## Environment Variables

### Core

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql+psycopg://postgres:postgres@postgres:5432/gym_tracker` | Database connection |
| `SECRET_KEY` | Yes | `change-me-in-production` | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `60` | Access token lifetime |
| `LOG_LEVEL` | No | `INFO` | Logging verbosity |
| `FRONTEND_ORIGIN` | No | `http://localhost:5173` | Primary CORS origin |
| `FRONTEND_ORIGINS` | No | `http://localhost:5173,http://127.0.0.1:5173` | Allowed frontend origins |
| `APP_URL` | No | `http://localhost:5173` | Redirects and email links |
| `VITE_API_BASE_URL` | No | `/api` | Frontend API base path |

### Integrations

| Variable group | Purpose |
|---|---|
| `GROQ_API_KEY`, `GROQ_MODEL` | AI Coach provider configuration |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_YEARLY_PRICE_ID` | Billing and subscriptions |
| `RESEND_API_KEY`, `FROM_EMAIL` | Transactional email delivery |
| `SENTRY_DSN` | Error monitoring |

## Repository Layout

```text
gym-app/
├── backend/
│   ├── app/
│   │   ├── core/          # config, database, security, logging, rate limiter
│   │   ├── models/        # 23 SQLAlchemy models
│   │   ├── routes/        # 19 FastAPI route modules
│   │   ├── schemas/       # 11 Pydantic schema modules
│   │   ├── services/      # 14 service classes owning all business logic
│   │   └── utils/         # auth dependencies, tier gates, admin guards
│   ├── alembic/           # 13 database migrations
│   └── tests/             # unit + integration suites
├── frontend/
│   ├── public/            # manifest, service worker
│   └── src/
│       ├── api/           # Axios client with JWT refresh
│       ├── assets/        # category photos
│       ├── components/    # 22 shared components
│       ├── data/          # exercise catalog (83 exercises), image catalog
│       ├── hooks/         # useToast, useSubscription, useCountUp, useKeyboardShortcuts
│       ├── pages/         # 19 page components
│       └── utils/         # JWT helpers, unit conversion, workout parser
├── docs/                  # screenshots for README
├── infra/terraform/aws/   # VPC, EKS, RDS, WAF, CDN
├── k8s/base/              # 14 Kubernetes manifests
├── .github/workflows/     # CI, publish, deploy pipelines
├── docker-compose.yml
└── docker-compose.prod.yml
```

## Troubleshooting

- Backend unavailable: check `http://localhost:8000/health`
- Frontend API issues outside Docker: verify `VITE_API_BASE_URL`
- Compose startup problems: run `docker compose logs backend frontend postgres`
- Clean local reset:

```bash
docker compose down -v
docker compose up --build
```

## License

This repository is intended as a portfolio and learning project.
