# Workout Templates — Design Doc

**Date:** 2026-04-05  
**Inspired by:** SmartGym (smartgymapp.com) — their 130+ built-in routines and named program templates.

---

## Problem

Users currently have to rebuild their exercise list from scratch every workout. There is no way to save a named routine ("Push Day A", "Full Body") and reuse it. This is the most significant UX gap compared to SmartGym and standard gym tracking apps.

## Goal

Allow users to create, edit, and delete named workout templates. Each template is an ordered list of exercises with optional target weight/reps/sets. From the workout logging page, users can select a template to pre-fill the form. From workout history, users can save any past session as a named template.

---

## Data Model

Two new tables mirror the existing `Workout` / `WorkoutSet` pattern.

### `workout_templates`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | CASCADE delete |
| name | TEXT | Unique per user |
| created_at | TIMESTAMP | server_default |

### `template_sets`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| template_id | UUID FK → workout_templates | CASCADE delete |
| exercise_id | UUID FK → exercises | CASCADE delete |
| weight | FLOAT | **nullable** — targets are optional |
| reps | INTEGER | **nullable** |
| sets | INTEGER | **nullable** |
| position | INTEGER | Preserves exercise order |

---

## Backend API

New router prefix: `/templates`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/templates` | Create template with name + sets |
| GET | `/templates` | List user's templates (sets eager-loaded) |
| GET | `/templates/{id}` | Single template detail |
| PUT | `/templates/{id}` | Replace name + sets (full replace, not patch) |
| DELETE | `/templates/{id}` | Delete template (cascades to template_sets) |

### Files to create/modify
- `backend/app/models/template.py` — `WorkoutTemplate` and `TemplateSet` ORM models
- `backend/app/schemas/template.py` — Pydantic request/response schemas
- `backend/app/services/template_service.py` — `TemplateService` class
- `backend/app/routes/templates.py` — Router registered with `get_current_user`
- `backend/app/main.py` — Register new router
- `backend/app/models/__init__.py` — Import new models so Alembic detects them
- Alembic migration: `alembic revision --autogenerate -m "add workout templates"`

### Service layer pattern
Follows the same ownership-check pattern as `WorkoutService`:
- On create: verify all `exercise_id`s belong to the current user
- On get/update/delete: filter by `user_id` or raise 404

---

## Frontend

### New page: `/templates` (`TemplatesPage.jsx`)
- Top section: "New Template" form
  - Template name input
  - Exercise rows (same `set-row-card` UI as WorkoutsPage) with optional weight/reps/sets
  - "Add Exercise" and "Save Template" buttons
- Below: list of saved templates as cards
  - Shows name, exercise count, exercise name preview (first 3)
  - "Edit" (in-place, replaces card with edit form) and "Delete" (ConfirmDialog) per card

### WorkoutsPage changes
- Add "Start from Template" dropdown above the workout form
  - Populated from `GET /templates`
  - Selecting a template pre-fills the exercise rows (exercise_id, weight, reps, sets)
  - User can adjust any field before logging
- Add "Save as Template" button on each history workout card (alongside the existing delete button)
  - Opens a small name input prompt (or inline input on the card)
  - Calls `POST /templates` with the workout's exercises and numbers

### Layout / routing changes
- `App.jsx`: add `<Route path="/templates" element={<TemplatesPage />} />`
- `Layout.jsx` `pageViewByPath`: add `/templates` entry with title, subtitle, and photo assets

---

## Verification

1. **Backend unit tests** — add `tests/unit/test_template_service.py` covering: create, list, get, update, delete, ownership enforcement, duplicate name conflict.
2. **Backend integration tests** — add `tests/integration/test_templates.py` covering the 5 API routes end-to-end.
3. **Alembic migration** — `alembic upgrade head` applies cleanly on a fresh DB.
4. **Frontend build** — `npm run build` passes with no errors.
5. **Full stack smoke test** — `docker compose up --build`, then:
   - Create a template with 3 exercises (mix of with/without targets)
   - Edit the template (rename, change an exercise)
   - Delete the template
   - Create another template, go to Workouts, select it from dropdown → form pre-fills
   - Log a workout, then use "Save as Template" from the history card
