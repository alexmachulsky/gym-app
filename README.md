# Smart Gym Progress Tracker

Production-grade full-stack fitness analytics platform built in phases with a DevOps-first mindset.

[![CI](https://github.com/alexmachulsky/gym-app/actions/workflows/ci.yml/badge.svg)](https://github.com/alexmachulsky/gym-app/actions/workflows/ci.yml)
[![Publish Docker Images](https://github.com/alexmachulsky/gym-app/actions/workflows/publish-images.yml/badge.svg)](https://github.com/alexmachulsky/gym-app/actions/workflows/publish-images.yml)
[![Deploy to EKS](https://github.com/alexmachulsky/gym-app/actions/workflows/deploy-k8s.yml/badge.svg)](https://github.com/alexmachulsky/gym-app/actions/workflows/deploy-k8s.yml)

## What This Project Delivers

This app helps users log training data and track progression quality through a clean API and modern dashboard.

- Secure authentication with JWT and hashed passwords
- Workout logging with multi-set entries per session
- Body-weight tracking with historical timeline
- Progression intelligence (volume, estimated 1RM, plateau detection)
- Structured JSON logging and health checks
- Containerized local stack (frontend, backend, postgres)
- CI workflows and Docker image publishing
- AWS EKS + Kubernetes deployment assets (Phase 3)

## Architecture

```text
React (Vite) SPA
    |
FastAPI Backend (Service Layer + SQLAlchemy)
    |
PostgreSQL
```

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React, Vite, Axios, React Router |
| Backend | Python 3.11, FastAPI, SQLAlchemy, Alembic, Pydantic |
| Security | JWT, passlib/bcrypt |
| Database | PostgreSQL 16 |
| Testing | pytest (unit + integration) |
| Containers | Docker, Docker Compose |
| CI/CD | GitHub Actions, GHCR |
| Cloud/Orchestration | Terraform (AWS), EKS, Kubernetes |

## Project Structure

```text
gym-app/
├── backend/
│   ├── app/                # routes, schemas, models, services, core
│   ├── alembic/            # migrations
│   └── tests/              # unit + integration tests
├── frontend/
│   └── src/                # pages, components, api client, styles, assets
├── docker-compose.yml
├── .env.example
├── infra/terraform/aws/    # phase 3 infra
└── k8s/base/               # phase 3 manifests
```

## Quick Start (Recommended)

### 1) Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at least:

- `SECRET_KEY` to a strong random value

### 2) Start full stack

```bash
docker compose up --build
```

### 3) Open services

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- Postgres: `localhost:5432`

## How To Use The UI

1. Register a user account from the Register page.
2. Login and open **Exercises**.
3. Add custom exercises or bulk-add from the built-in exercise library.
4. Open **Workouts** and log a session date plus one or more set rows.
5. Open **Body Metrics** to record and review weight history.
6. Open **Progress** and select an exercise for progression analysis.

The UI now uses real gym photos for route banners, side visuals, and exercise library cards.

## Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `POSTGRES_DB` | No | `gym_tracker` | Database name |
| `POSTGRES_USER` | No | `postgres` | Database user |
| `POSTGRES_PASSWORD` | No | `postgres` | Database password |
| `DATABASE_URL` | Yes | `postgresql+psycopg://postgres:postgres@postgres:5432/gym_tracker` | SQLAlchemy DB connection |
| `SECRET_KEY` | Yes | `change-this-secret-in-real-env` | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `60` | JWT lifetime |
| `LOG_LEVEL` | No | `INFO` | Backend log level |
| `FRONTEND_ORIGIN` | No | `http://localhost:5173` | Primary CORS origin |
| `FRONTEND_ORIGINS` | No | `http://localhost:5173,http://127.0.0.1:5173` | Allowed CORS origins |
| `VITE_API_BASE_URL` | No | `/api` | Frontend API base path |

## API Endpoints

### Health
- `GET /health`

### Auth
- `POST /auth/register`
- `POST /auth/login`

### Exercises (JWT required)
- `POST /exercises`
- `GET /exercises`

### Workouts (JWT required)
- `POST /workouts`
- `GET /workouts`

### Body Metrics (JWT required)
- `POST /body-metrics`
- `GET /body-metrics`

### Progress (JWT required)
- `GET /progress/{exercise_id}`

## Progression Logic

Implemented in a dedicated service layer (`backend/app/services/progression_service.py`):

- `volume = weight * reps * sets`
- `estimated_1RM = weight * (1 + reps / 30)`
- Plateau warning if the last 3 sessions show no strict increase in both progression signals.

## Testing

### Backend tests

```bash
cd backend
pytest -q
```

### Frontend production build

```bash
cd frontend
npm ci
npm run build
```

## CI/CD (Phase 2)

GitHub Actions workflows in `.github/workflows/`:

- `ci.yml`
  - Kubernetes manifest render validation
  - backend tests
  - frontend build
  - docker image build checks
  - docker compose smoke test
- `publish-images.yml`
  - pushes backend/frontend images to GHCR on `main`/`master`
- `deploy-k8s.yml`
  - manual workflow to deploy and update images in EKS

## Kubernetes and AWS (Phase 3)

Deployment assets:

- Terraform: `infra/terraform/aws/`
- Kubernetes: `k8s/base/`
- Guide: `k8s/README.md`

Typical flow:

1. Provision EKS via Terraform.
2. Configure `kubectl` for cluster access.
3. Install ingress controller.
4. Apply manifests with `kubectl apply -k k8s/base`.
5. Roll forward image tags via `kubectl set image` or GitHub workflow.

## Troubleshooting

- Registration/login errors: verify backend is healthy at `http://localhost:8000/health`.
- Frontend stale assets: hard refresh (`Ctrl+Shift+R`).
- Container startup issues: inspect `docker compose logs backend frontend postgres`.
- Database reset during local dev:

```bash
docker compose down -v
docker compose up --build
```

## License

This repository is intended as a portfolio and learning project.
