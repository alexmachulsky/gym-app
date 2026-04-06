# ForgeMode

Smart Gym Progress Tracker is a full-stack fitness analytics SaaS app with a React + Vite frontend, FastAPI backend, PostgreSQL database, Docker Compose local stack, and AWS EKS deployment assets.

[![CI](https://github.com/alexmachulsky/gym-app/actions/workflows/ci.yml/badge.svg)](https://github.com/alexmachulsky/gym-app/actions/workflows/ci.yml)
[![Publish Docker Images](https://github.com/alexmachulsky/gym-app/actions/workflows/publish-images.yml/badge.svg)](https://github.com/alexmachulsky/gym-app/actions/workflows/publish-images.yml)
[![Deploy to EKS](https://github.com/alexmachulsky/gym-app/actions/workflows/deploy-k8s.yml/badge.svg)](https://github.com/alexmachulsky/gym-app/actions/workflows/deploy-k8s.yml)

## Product Snapshot

ForgeMode combines a public marketing site with an authenticated training dashboard for lifters who want more than a plain workout log.

- JWT auth with access and refresh tokens
- Workout logging with set-level entries, rest timer, active workout tools, and workout generation
- Exercise library with built-in templates and custom exercise support
- Body metrics tracking for weight, body fat, and muscle mass
- Progress analytics for volume, estimated 1RM, and plateau detection
- Workout templates, goals, settings, admin, and export flows
- AI Coach workflows for tips, parsing, and guided training assistance
- Free and Pro tiers with usage limits and billing hooks
- Dockerized local development plus Kubernetes and Terraform deployment assets

## Current UX

The current UI uses a dark, neon-lime visual system across:

- Public pages: landing, pricing, terms, privacy, login, register, forgot/reset password, verify email
- Authenticated pages: workouts, exercises, templates, body metrics, progress, goals, AI coach, settings, admin

The app shell uses route-specific banners and gym photography, while the marketing pages focus on signup and pricing conversion.

## Architecture

```text
React + Vite SPA
  |
Axios API client with JWT refresh/retry logic
  |
FastAPI application
  |
Service layer + SQLAlchemy ORM
  |
PostgreSQL
```

Backend follows a strict route -> service -> database-query pattern. FastAPI routes stay thin, services own business logic, and Pydantic schemas are kept separate from ORM models.

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React, Vite, React Router, Axios, Recharts |
| Backend | Python 3.11, FastAPI, SQLAlchemy, Alembic, Pydantic Settings |
| Auth & Security | JWT, bcrypt/passlib, refresh tokens, slowapi rate limiting |
| Database | PostgreSQL 16, psycopg v3 |
| Payments | Stripe integration points |
| AI | Groq-backed AI service hooks |
| Email | Resend integration points |
| Observability | Structured logging, health checks, optional Sentry |
| Testing | pytest unit and integration tests |
| Dev & Deploy | Docker Compose, GitHub Actions, GHCR, Terraform, Kubernetes/EKS |

## Repository Layout

```text
gym-app/
├── backend/
│   ├── app/
│   │   ├── core/          # config, database, security, logging, rate limiter
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routes/        # FastAPI route modules
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── services/      # business logic
│   │   └── utils/         # shared dependencies and helpers
│   ├── alembic/           # migrations
│   └── tests/             # unit + integration coverage
├── frontend/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── assets/
│       ├── components/
│       ├── data/
│       ├── hooks/
│       ├── pages/
│       └── utils/
├── infra/terraform/aws/
├── k8s/base/
├── docker-compose.yml
└── docker-compose.prod.yml
```

## Quick Start

### Full stack with Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

Set a real `SECRET_KEY` in `.env` before using the app beyond local experimentation.

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

## Major App Areas

### Authentication

- Register, login, refresh token, verify email, forgot password, reset password
- Access token lifetime: 60 minutes
- Refresh token lifetime: 30 days
- Rate limiting on `/auth/register` and `/auth/login`

### Workout Tracking

- Session logging with sets, reps, weight, duration, effort, and notes
- Rest timer and active-workout support
- Workout generation and import flows
- Owner-scoped workout history

### Exercise Management

- Built-in exercise library with category coverage
- Custom exercises
- Free-tier limits on exercise creation

### Progress and Metrics

- Body metrics history
- Progress charts for volume and estimated 1RM
- Plateau detection based on the last three sessions

Progression formulas:

- `volume = weight * reps * sets`
- `estimated_1RM = weight * (1 + reps / 30)`

### Templates, Goals, and AI

- Workout templates
- Goals and streak-oriented planning
- AI Coach endpoints and parsing/coaching workflows
- Pro gating for advanced features

### Billing and Plans

Free users are limited to:

- 10 exercises
- 3 templates
- 2 goals

Pro unlocks advanced charts, exports, equipment profiles, workout generator, and AI Coach workflows.

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
| `FRONTEND_ORIGINS` | No | `http://localhost:5173,http://127.0.0.1:5173` | Allowed origins |
| `VITE_API_BASE_URL` | No | `/api` | Frontend API base path |
| `APP_URL` | No | `http://localhost:5173` | Email links and Stripe redirects |

### Optional integrations

| Variable group | Purpose |
|---|---|
| `GROQ_*` | AI Coach provider configuration |
| `STRIPE_*` | Billing and subscriptions |
| `RESEND_API_KEY`, `FROM_EMAIL` | Transactional email delivery |
| `SENTRY_DSN` | Error monitoring |

## Testing

### Backend

```bash
cd backend
pytest -q
pytest tests/unit/
pytest tests/integration/
```

Tests use an in-memory SQLite database configured in `backend/tests/conftest.py`, so local Postgres is not required for test runs.

### Frontend production build

```bash
cd frontend
npm ci
npm run build
```

## Deployment

### Docker Compose

The local composed stack includes:

- `postgres`
- `backend`
- `frontend` served through nginx

### GitHub Actions

- `ci.yml`: tests, build checks, Kubernetes manifest validation, Docker checks
- `publish-images.yml`: publishes container images to GHCR
- `deploy-k8s.yml`: manual EKS deployment workflow

### Infrastructure

- Terraform: `infra/terraform/aws/`
- Kubernetes manifests: `k8s/base/`
- EKS deployment guide: `k8s/README.md`

## Troubleshooting

- Backend unavailable: check `http://localhost:8000/health`
- Frontend API issues outside Docker: verify `VITE_API_BASE_URL`
- Compose startup problems: run `docker compose logs backend frontend postgres`
- Local reset:

```bash
docker compose down -v
docker compose up --build
```

## License

This repository is intended as a portfolio and learning project.
