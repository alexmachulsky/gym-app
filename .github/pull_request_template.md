## What

<!-- Describe the change in 1-3 sentences. What does it do? -->

## Why

<!-- Why is this change needed? Link to context, user feedback, or a product decision. -->

## Linear issue

<!-- Paste the Linear issue ID, e.g. GYM-123. Leave blank if no associated issue. -->

Fixes: 

## Test plan

<!-- How did you verify this works? Tick what applies. -->

- [ ] Backend: `pytest -q` passes
- [ ] Frontend: `npm run build` passes
- [ ] Smoke test: `docker compose up --build --wait` + manual check
- [ ] E2E: `npx playwright test` passes (if app-level change)
- [ ] Manual: describe steps taken

## Screenshots / recordings

<!-- For any UI change, include a before/after screenshot or screen recording. -->

## Checklist

- [ ] No SQLAlchemy queries in route handlers (service layer only)
- [ ] New response schemas include `model_config = ConfigDict(from_attributes=True)`
- [ ] New pages added to `pageViewByPath` in `Layout.jsx`
- [ ] New env vars added to `.env.example` and documented in README
- [ ] Migrations created for schema changes (`alembic revision --autogenerate`)
- [ ] Tests added or updated for new service logic
