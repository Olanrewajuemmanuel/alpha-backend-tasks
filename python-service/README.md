# InsightOps Python Service Starter

FastAPI completed service for the backend assessment.

This service includes:

- FastAPI app bootstrap and health endpoint
- SQLAlchemy wiring
- Manual SQL migration runner
- The `briefings` feature with the create, generate, retrieve operations and template rendering according to the assessment requirements

## Setup Instructions

The setup instructions is largely the same as the original starter.

### Prerequisites

- Python 3.12
- PostgreSQL running from repository root:

```bash
docker compose up -d postgres
```

### Initial Setup

```bash
cd python-service
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

### Environment Configuration

`.env.example` includes:

- `DATABASE_URL`
- `APP_ENV`
- `APP_PORT`

## How to Run Server

```bash
cd python-service
source .venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

The service will be available at `http://localhost:8000`

## How to Run Migrations

The migration system is still the simple manual runner that applies SQL files in order. The SQL migration files are created and sql is manually added [NOTE: This is not a production-ready migration system, but it is sufficient for this assessment].

### Apply Pending Migrations

```bash
cd python-service
source .venv/bin/activate
python -m app.db.run_migrations up
```

### Roll Back Latest Migration

```bash
cd python-service
source .venv/bin/activate
python -m app.db.run_migrations down --steps 1
```

### Migration System Details

- SQL files live in `python-service/db/migrations/`
- A `schema_migrations` table tracks applied filenames
- Up files are applied in sorted filename order (`*.sql` or `*.up.sql`)
- Rollback uses a paired `*.down.sql` file for each applied migration
- Applied migration files are skipped on subsequent runs

## How to Run Tests

```bash
cd python-service
source .venv/bin/activate
python -m pytest
```
Note: The test database should use postgresql as the database. Some postgresql-specific features e.g., `generate_uuid()` are used in the migration files and will throw an error if the test database is not postgresql. Simply, adding a `test_assessment_db` to your db server for the test is sufficient for this purpose.

## API Reference

---

### `POST /briefings`

**Body**
```json
{
  "companyName": "Acme Holdings",
  "ticker": "ACME",
  "sector": "Industrial Technology",
  "analystName": "Jane Doe",
  "summary": "Acme is benefiting from strong enterprise demand...",
  "recommendation": "Monitor for margin expansion before increasing exposure.",
  "keyPoints": [
    "Revenue grew 18% year-over-year.",
    "Management raised full-year guidance."
  ],
  "risks": [
    "Top two customers account for 41% of total revenue."
  ],
  "metrics": [
    { "name": "Revenue Growth", "value": "18%" },
    { "name": "P/E Ratio", "value": "28.1x" }
  ]
}
```

**Status codes**
| Code | Reason |
|------|--------|
| `201 Created` | Briefing stored successfully |
| `422 Unprocessable Entity` | Validation failure — missing required field, fewer than 2 key points, fewer than 1 risk, duplicate metric name, blank string in list |

**Response body** (`201`)
```json
{
  "id": "a1b2c3d4-...",
  "company_name": "Acme Holdings",
  "ticker": "ACME",
  "sector": "Industrial Technology",
  "analyst_name": "Jane Doe",
  "summary": "Acme is benefiting from strong enterprise demand...",
  "recommendation": "Monitor for margin expansion before increasing exposure.",
  "is_generated": false,
  "generated_at": null,
  "created_at": "2026-03-10T14:32:00Z",
  "updated_at": "2026-03-10T14:32:00Z",
  "key_points": [
    { "id": "...", "point_type": "KEY_POINT", "content": "Revenue grew 18% year-over-year.", "display_order": 0 }
  ],
  "risks": [
    { "id": "...", "point_type": "RISK", "content": "Top two customers account for 41% of total revenue.", "display_order": 0 }
  ],
  "metrics": [
    { "id": "...", "name": "Revenue Growth", "value": "18%", "display_order": 0 }
  ]
}
```

---

### `GET /briefings/{id}`

**Path parameter** — `id`: UUID of the briefing

**Status codes**
| Code | Reason |
|------|--------|
| `200 OK` | Briefing found |
| `404 Not Found` | No briefing exists with this ID |
| `422 Unprocessable Entity` | `id` is not a valid UUID |

**Response body** (`200`) — same shape as `POST /briefings` 201 response above.

---

### `POST /briefings/{id}/generate`

**Path parameter** — `id`: UUID of the briefing to generate

Triggers HTML rendering as a background task. Returns immediately with `202`. The briefing's `is_generated` flag and `rendered_html` are populated once the task completes. Poll `GET /briefings/{id}` until `is_generated` is `true` before fetching the HTML.

**Status codes**
| Code | Reason |
|------|--------|
| `202 Accepted` | Generation task accepted and queued |
| `404 Not Found` | No briefing exists with this ID |
| `422 Unprocessable Entity` | `id` is not a valid UUID |

**Response body** (`202`)
```json
{
  "id": "a1b2c3d4-...",
  "generated_at": "2026-03-10T14:33:00Z",
  "message": "Report generated successfully."
}
```

---

### `GET /briefings/{id}/html`

**Path parameter** — `id`: UUID of the briefing

Returns the stored rendered HTML document. Must not be called before generation is complete — the endpoint returns `404` if `rendered_html` is still `NULL`.

**Status codes**
| Code | Reason |
|------|--------|
| `200 OK` | HTML document returned |
| `404 Not Found` | No briefing with this ID, or generation not yet complete |
| `422 Unprocessable Entity` | `id` is not a valid UUID |

**Response body** (`200`) — `Content-Type: text/html`
```html
<!DOCTYPE html>
<html lang="en">
  <head>...</head>
  <body>
    <!-- Fully rendered briefing report -->
  </body>
</html>
```
## Assumptions and Tradeoffs

### Assumptions

- Briefing status is sufficient to indicate whether the metric is generated or not, so the `generated_at` field is used to track status. In production, this might need to be more sophisticated.

### Tradeoffs

- Manual SQL migration runner instead of Alembic for simplicity and control
- No automatic migration application on startup - manual execution required
- Minimal template system to keep the starter focused on core functionality
- Decision to enforce `metric names` validation on the `BriefingMetrics` schema - application-level validation using a set() on request-time in memory => max_length of 255 characters * max_length of about 100 metrics = 25,500 characters maximum ~25KB

## Project Layout

- `app/main.py`: FastAPI bootstrap and router wiring
- `app/config.py`: environment config
- `app/db/`: SQLAlchemy session management and migration runner
- `db/migrations/`: SQL migration files
- `app/models/`: ORM models
- `app/schemas/`: Pydantic request/response schemas
- `app/services/`: service-layer logic and template helpers
- `app/api/`: route handlers
- `app/templates/`: Jinja templates
- `tests/`: test suite
