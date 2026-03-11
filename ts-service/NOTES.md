
## Design Decisions

- **Provider abstraction via injection token** — Swapping providers (e.g. Gemini, Claude) requires changing one binding, nothing else.

- **Guard attaches candidate to request** — `WorkspaceGuard` resolves and attaches the `SampleCandidate` to `request.candidate`, so controllers and services never re-fetch it for auth purposes.

- **`rawText` extracted at upload, stored in DB** — the worker reads `rawText` directly from the database rather than reading files from disk at processing time, keeping the worker simple and decoupled from storage.

---

## Schema Decisions

```sql
-- Workspaces (pre-existing)
sample_workspaces
  id            VARCHAR(64)   PRIMARY KEY
  name          VARCHAR(120)  NOT NULL
  created_at    TIMESTAMPTZ

-- Candidates (pre-existing)
sample_candidates
  id            VARCHAR(64)   PRIMARY KEY
  workspace_id  VARCHAR(64)   NOT NULL  REFERENCES sample_workspaces(id) ON DELETE CASCADE
  full_name     VARCHAR(160)  NOT NULL
  email         VARCHAR(160)
  created_at    TIMESTAMPTZ

-- Documents uploaded for a candidate
candidate_documents
  id             UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
  candidate_id   VARCHAR(64)   NOT NULL  REFERENCES sample_candidates(id) ON DELETE CASCADE
  document_type  ENUM('resume', 'cover_letter', 'other')  NOT NULL
  file_name      VARCHAR(255)  NOT NULL
  storage_key    VARCHAR(500)  NOT NULL
  raw_text       TEXT          NOT NULL
  uploaded_at    TIMESTAMPTZ   DEFAULT now()

-- AI-generated summaries for a candidate
candidate_summaries
  id                   UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
  candidate_id         VARCHAR(64)   NOT NULL  REFERENCES sample_candidates(id) ON DELETE CASCADE
  status               ENUM('pending', 'completed', 'failed')  NOT NULL  DEFAULT 'pending'
  score                INT
  strengths            TEXT[]
  concerns             TEXT[]
  summary              TEXT
  recommended_decision ENUM('advance', 'reject', 'hold')
  provider             VARCHAR(64)
  prompt_version       VARCHAR(32)
  error_message        TEXT
  created_at           TIMESTAMPTZ   DEFAULT now()
  updated_at           TIMESTAMPTZ   DEFAULT now()
```

---

## What I Would Improve With More Time

- **Persistent queue** — replace the in-memory `QueueService` with a real queue. The current implementation loses all pending jobs on server restart and has no retry mechanism.

- **File storage abstraction** — introduce a `StorageProvider` interface (local disk / S3) such that switching storage providers is as simple as changing one binding.

- **Text extraction pipeline** — `rawText` is currently extracted via `buffer.toString('utf-8')`, which only works for plain text files. A proper pipeline would use libraries for different file types.
