## Design Decisions

- **Hard layer boundaries.** Router handles HTTP only, service handles data access only, formatter handles transformation only, template handles rendering only. Each layer has one job and dependencies only flow downward — nothing reaches back up the stack.

- **Formatter is its own module, not a service method.** Formatting is a presentation concern. It changes for different reasons than business logic. Keeping it isolated means it can be unit tested without a database and reused for both HTML and any future JSON rendering path.

- **`briefing.html` is self-contained, no `{% extends %}`.** The rendered HTML is stored as a string in the database. A template that extends a base would create a silent runtime dependency — changes to `base.html` after generation would diverge from what was stored. A standalone template is a faithful snapshot.

---

## Schema Decisions
```sql

-- Main briefing table
briefings
  id                UUID         PK
  company_name      VARCHAR(255) NOT NULL
  ticker            VARCHAR(20)  NOT NULL
  sector            VARCHAR(100)
  analyst_name      VARCHAR(255)
  summary           TEXT         NOT NULL
  recommendation    TEXT         NOT NULL
  rendered_html     TEXT
  generated_at      TIMESTAMPTZ
  created_at        TIMESTAMPTZ  NOT NULL
  updated_at        TIMESTAMPTZ  NOT NULL

-- Briefing points to keep both key points and risks
briefing_points
  id             UUID        PK
  briefing_id    UUID        FK → briefings.id ON DELETE CASCADE
  point_type     VARCHAR(10) NOT NULL  -- 'KEY_POINT' | 'RISK'
  content        TEXT        NOT NULL
  display_order  INTEGER     NOT NULL
  created_at     TIMESTAMPTZ NOT NULL

-- Metrics for the briefing
briefing_metrics
  id             UUID         PK
  briefing_id    UUID         FK → briefings.id ON DELETE CASCADE
  name           VARCHAR(100) NOT NULL
  value          VARCHAR(100) NOT NULL
  display_order  INTEGER      NOT NULL
  created_at     TIMESTAMPTZ  NOT NULL

```

---

## What I Would Improve With More Time

- **A proper background task queue.** HTML generation currently relies on FastAPI's `BackgroundTasks`, which runs in the same process with no retry, and no recovery if the worker crashes mid-render. Replacing it with Celery or RabbitMQ would give retries, dead-letter handling, and a status endpoint that reflects real task state.

- **Generation status endpoint.** A `GET /briefings/{id}/status` endpoint returning a machine-readable state (`pending`, `generating`, `complete`, `failed`) with an optional `error` field would make design more robust and observable.

- **Pagination for list endpoint.** The `/briefings` endpoint currently returns all records. Adding query params like `?page=1&limit=20` would make it scalable for large datasets.
