# Smart Gym Progress Tracker (Phases 1-3)

Production-style full-stack fitness tracking app with FastAPI, React, PostgreSQL, Docker Compose, JWT auth, progression analytics, and tests.

## Architecture

- Frontend: React + Vite
- Backend: FastAPI + SQLAlchemy + Alembic
- Database: PostgreSQL
- Runtime: Docker Compose

## Features

- JWT authentication (`/auth/register`, `/auth/login`)
- Exercise creation and listing
- Workout logging with multiple sets per workout
- Body metric logging and chronological history
- Progression engine for volume, estimated 1RM, and plateau detection
- JSON structured request logging
- `/health` endpoint
- Unit and integration tests with `pytest`
- CI pipeline for backend tests, frontend build, Docker image builds, and compose smoke testing
- Optional GHCR image publish workflow for backend and frontend containers
- AWS EKS + Kubernetes deployment assets (Terraform + manifests + deploy workflow)

## Project Structure

- `backend/` FastAPI application, migration setup, and tests
- `frontend/` React Vite app with protected pages
- `docker-compose.yml` local orchestration
- `.env.example` environment variable template
- `infra/terraform/aws/` Terraform for cloud infrastructure (VPC + EKS)
- `k8s/base/` Kubernetes manifests (namespace, app, db, ingress)

## Environment Setup

1. Copy environment template:

```bash
cp .env.example .env
```

2. Update `SECRET_KEY` in `.env`.

## Run with Docker Compose

```bash
docker compose up --build
```

Services:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432

## Run Backend Tests

From `backend/`:

```bash
pytest
```

## Phase 2: CI/CD

Workflows are in `.github/workflows/`:

- `ci.yml`
- `publish-images.yml`
- `deploy-k8s.yml`

### CI workflow (`ci.yml`)

Runs on pull requests and pushes to `main`/`master`:

- Backend tests (`pytest`)
- Frontend dependency install + production build
- Docker build validation for backend/frontend images
- Docker Compose smoke test (`/health` + frontend response)

### Publish workflow (`publish-images.yml`)

Runs on push to `main`/`master` and `workflow_dispatch`:

- Builds backend and frontend images
- Pushes to GHCR as:
  - `ghcr.io/<owner>/<repo>-backend:latest`
  - `ghcr.io/<owner>/<repo>-frontend:latest`
  - plus immutable `sha-*` tags

Required permissions/secrets:

- Uses built-in `GITHUB_TOKEN` with `packages: write` permission

## Phase 3: Cloud + Kubernetes

Infrastructure and deployment assets:

- Terraform: `infra/terraform/aws/`
- Kubernetes manifests: `k8s/base/`
- Deployment guide: `k8s/README.md`
- Manual deployment workflow: `.github/workflows/deploy-k8s.yml`

### Quick flow

1. Provision AWS EKS with Terraform.
2. Configure kubeconfig using Terraform output.
3. Install NGINX ingress controller.
4. Update Kubernetes secrets/ingress host/image tags.
5. Deploy with:

```bash
kubectl apply -k k8s/base
```

6. Optionally run GitHub Actions manual workflow `Deploy to EKS` for rollout updates.

## API Endpoints

### Health

- `GET /health`

### Auth

- `POST /auth/register`
- `POST /auth/login`

### Exercises (auth required)

- `POST /exercises`
- `GET /exercises`

### Workouts (auth required)

- `POST /workouts`
- `GET /workouts`

### Body Metrics (auth required)

- `POST /body-metrics`
- `GET /body-metrics`

### Progress (auth required)

- `GET /progress/{exercise_id}`

## Notes

- Business logic lives in service layer (`backend/app/services`), not in route handlers.
- Alembic migration `20260216_0001` defines the initial schema and indexes.
- Error format includes `detail`, and validation errors include `error_code` and `fields`.
- Frontend uses same-origin `/api` proxy (Nginx -> backend) to avoid browser CORS issues across hosts/IPs.
