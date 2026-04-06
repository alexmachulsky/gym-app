# ForgeMode

> Train with clarity. Improve with data.

ForgeMode is a full-stack fitness analytics SaaS app for lifters who want more than a plain workout log. It combines a React + Vite SPA, a FastAPI backend, PostgreSQL persistence, Docker Compose local development, and AWS EKS deployment assets in one repo.

[![CI](https://github.com/alexmachulsky/gym-app/actions/workflows/ci.yml/badge.svg)](https://github.com/alexmachulsky/gym-app/actions/workflows/ci.yml)
[![Publish Docker Images](https://github.com/alexmachulsky/gym-app/actions/workflows/publish-images.yml/badge.svg)](https://github.com/alexmachulsky/gym-app/actions/workflows/publish-images.yml)
[![Deploy to EKS](https://github.com/alexmachulsky/gym-app/actions/workflows/deploy-k8s.yml/badge.svg)](https://github.com/alexmachulsky/gym-app/actions/workflows/deploy-k8s.yml)

## Why This Repo Is Interesting

ForgeMode is built as a product, not just a CRUD demo:

- Public marketing pages and an authenticated app shell live in the same frontend
- JWT auth uses access and refresh tokens, with frontend auto-refresh and queued request replay
- The backend follows a strict route -> service -> database-query structure
- Free and Pro tiers are enforced in the application layer, not just in UI copy
- AI, billing, email, export, admin, and equipment-profile flows are already wired into the platform surface
- The project ships with both a Docker-first local workflow and EKS-ready deployment assets

## Experience At A Glance

| Landing page | Workout command center |
|---|---|
| ![ForgeMode landing page](docs/images/readme-home.png) | ![ForgeMode workout dashboard](docs/images/readme-workouts.png) |

The current UI uses a dark, neon-lime visual system across the public site, auth flows, and the logged-in training dashboard.

## What ForgeMode Does

### For users

- Log workouts with set-level detail, notes, effort, and timers
- Browse a curated library of 83 exercises across 12 categories with Pexels-sourced images
- Add custom exercises on top of the built-in catalog
- Track body metrics over time
- Analyze progression with volume, estimated 1RM, and plateau detection
- Save workout templates, set goals, and manage training preferences
- Upgrade into AI Coach, advanced analytics, export, and equipment profile workflows

### For developers

- React + Vite frontend with a centralized Axios client and token refresh flow
- FastAPI service layer with SQLAlchemy ORM and Alembic migrations
- Owner-scoped resource handling, Pro gates, and free-tier limits
- Docker Compose local stack with frontend, backend, and PostgreSQL
- GitHub Actions pipelines for tests, builds, image publishing, and Kubernetes deployment
- Terraform and Kubernetes manifests for AWS EKS rollout

## Product Areas

| Area | What you get |
|---|---|
| Authentication | Register, login, refresh token, verify email, forgot password, reset password |
| Workout Tracking | Session logging, rest timer, workout generator hooks, active workout utilities, workout history |
| Exercise Library | 83 built-in exercises across 12 categories with curated images, plus custom exercise creation |
| Body Metrics | Weight, body fat, and muscle mass tracking |
| Progress Analytics | Volume, estimated 1RM, charting, plateau detection |
| Templates & Goals | Reusable workout templates and training goals |
| AI Coach | Coaching, parsing, and workout-assistance routes and UI |
| SaaS Controls | Billing, admin, export, equipment profiles, settings, usage limits |

## Free vs Pro Model

The backend currently enforces these limits and feature gates:

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
    B --> E[Stripe integration]
    B --> F[Groq AI integration]
    B --> G[Resend email integration]
    B --> H[Sentry monitoring]
```

The backend stays disciplined: routes stay thin, services own business logic, and schemas stay separate from ORM models. On the frontend, a single Axios client injects tokens, handles refresh, and retries queued requests after re-authentication.

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React, Vite, React Router, Axios, Recharts |
| Backend | Python 3.11, FastAPI, SQLAlchemy, Alembic, Pydantic Settings |
| Auth & Security | JWT, bcrypt/passlib, refresh tokens, slowapi rate limiting |
| Database | PostgreSQL 16, psycopg v3 |
| AI | Groq-backed service hooks |
| Payments | Stripe integration points |
| Email | Resend integration points |
| Observability | Structured logging, health checks, optional Sentry |
| Testing | pytest unit and integration suites |
| Delivery | Docker Compose, GitHub Actions, GHCR, Terraform, Kubernetes/EKS |

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

## How Progress Is Calculated

Progression logic lives in `backend/app/services/progression_service.py`.

- `volume = weight * reps * sets`
- `estimated_1RM = weight * (1 + reps / 30)`
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

### Local

- `postgres`
- `backend`
- `frontend` served through nginx

### CI/CD

- `ci.yml` runs backend tests, frontend build checks, Kubernetes manifest validation, and Docker verification
- `publish-images.yml` publishes backend and frontend images to GHCR
- `deploy-k8s.yml` provides a manual EKS deployment workflow

### Infrastructure

- Terraform: `infra/terraform/aws/`
- Kubernetes manifests: `k8s/base/`
- Deployment guide: `k8s/README.md`

## API Surface

The backend currently exposes route groups for:

- `/health`
- `/auth`
- `/billing`
- `/exercises`
- `/workouts`
- `/body-metrics`
- `/progress`
- `/templates`
- `/settings`
- `/goals`
- `/export`
- `/equipment-profiles`
- `/ai`
- `/admin`

## Environment Variables

### Core

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql+psycopg://postgres:postgres@postgres:5432/gym_tracker` | Database connection |
| `SECRET_KEY` | Yes | `change-me-in-production` | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `60` | Access token lifetime |
| `FRONTEND_ORIGIN` | No | `http://localhost:5173` | Primary CORS origin |
| `FRONTEND_ORIGINS` | No | `http://localhost:5173,http://127.0.0.1:5173` | Allowed frontend origins |
| `APP_URL` | No | `http://localhost:5173` | Redirects and email links |
| `VITE_API_BASE_URL` | No | `/api` | Frontend API base path |

### Optional integrations

| Variable group | Purpose |
|---|---|
| `GROQ_*` | AI Coach provider configuration |
| `STRIPE_*` | Billing and subscriptions |
| `RESEND_API_KEY`, `FROM_EMAIL` | Transactional email delivery |
| `SENTRY_DSN` | Error monitoring |

## Repository Layout

```text
gym-app/
├── backend/
│   ├── app/
│   │   ├── core/          # config, database, security, logging, rate limiter
│   │   ├── models/        # 12 SQLAlchemy models (User, Exercise, Workout, …)
│   │   ├── routes/        # 14 FastAPI route modules
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── services/      # 13 service classes owning all business logic
│   │   └── utils/         # shared dependencies (auth, tier gates)
│   ├── alembic/           # database migrations
│   └── tests/             # unit + integration suites
├── frontend/
│   ├── public/            # manifest, service worker
│   └── src/
│       ├── api/           # Axios client with JWT refresh
│       ├── assets/        # category photos
│       ├── components/    # 18 shared components
│       ├── data/          # exercise catalog, image catalog, stretch suggestions
│       ├── hooks/         # useToast, useSubscription
│       ├── pages/         # 19 page components
│       └── utils/         # JWT helpers
├── docs/                  # screenshots for README
├── infra/terraform/aws/   # EKS infrastructure
├── k8s/base/              # Kubernetes manifests
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
