# TalentFlow TypeScript Service Starter

NestJS service for the backend assessment.

This service includes:

- Nest bootstrap with global validation
- TypeORM + migration setup
- Fake auth context (`x-user-id`, `x-workspace-id`)
- Tiny workspace-scoped sample module
- Queue abstraction module
- LLM provider abstraction with a fake summarization provider
- API endpoints for candidate document and summary workflow
- Jest test setup


## Setup Instructions

### Prerequisites

- Node.js 22+
- npm
- PostgreSQL running from repository root:

```bash
docker compose up -d postgres
```

### Initial Setup

```bash
cd ts-service
npm install
cp .env.example .env
```

### Environment Configuration

- `PORT`
- `DATABASE_URL`
- `NODE_ENV`
- `ANTHROPIC_API_KEY` (Used to connect to Claude's implementation of the summarization provider)

Do not commit API keys or secrets.

Get your Anthropic API key from [Anthropic Console](https://console.anthropic.com/).

## Setup

```bash
cd ts-service
npm run start:dev
```

The service will be available at `http://localhost:3000`

### Fake Auth Headers

Endpoints in this starter are protected by a fake local auth guard.
Include these headers in requests:

- `x-user-id`: any non-empty string (example: `user-1`)
- `x-workspace-id`: workspace identifier used for scoping (example: `workspace-1`)

## How to Run Migrations

```bash
cd ts-service
npm run migration:run
```

Note: TypeORM migrations are used for database schema management. Migration files are located in `src/migrations/`.

## How to Run Tests

### Unit Tests

```bash
cd ts-service
npm test
```

### End-to-End Tests

```bash
cd ts-service
npm run test:e2e
```

## API Reference

All endpoints require the following headers:

| Header | Description |
|---|---|
| `x-user-id` | Any non-empty string identifying the requester |
| `x-workspace-id` | Workspace scope — candidates outside this workspace return `404` |

---

### POST /candidates/:candidateId/documents

Upload a document for a candidate.

**Request** — `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | ✓ | Plain text file (.txt, .md) |
| `documentType` | string | ✓ | `resume` \| `cover_letter` \| `other` |
| `fileName` | string | ✓ | Display name for the document |

**Response codes**

| Code | Reason |
|---|---|
| `201` | Document created |
| `400` | Missing file or invalid body |
| `404` | Candidate not found or outside workspace |

**Response body `201`**
```json
{
  "id": "a1b2c3d4-...",
  "candidateId": "candidate-1",
  "documentType": "resume",
  "fileName": "john_doe_resume.txt",
  "storageKey": "uploads/workspace-1/candidate-1/1741694400000-john_doe_resume.txt",
  "uploadedAt": "2026-03-11T10:00:00.000Z"
}
```

---

### POST /candidates/:candidateId/summaries/generate

Queue an AI summary generation for a candidate.

**Request body** — none

**Response codes**

| Code | Reason |
|---|---|
| `202` | Summary queued |
| `404` | Candidate not found or outside workspace |
| `422` | Candidate has no documents to summarize |

**Response body `202`**
```json
{
  "summaryId": "e5f6g7h8-...",
  "status": "pending",
  "message": "Summary generation is being processed",
  "next": "/candidates/candidate-1/summaries/e5f6g7h8-...",
  "requestTimestamp": "2026-03-11T10:00:00.000Z"
}
```

---

### GET /candidates/:candidateId/summaries

List all summaries for a candidate, ordered by `createdAt` descending.

**Request body** — none

**Response codes**

| Code | Reason |
|---|---|
| `200` | Success |
| `404` | Candidate not found or outside workspace |

**Response body `200`**
```json
[
  {
    "id": "e5f6g7h8-...",
    "candidateId": "candidate-1",
    "status": "completed",
    "score": 82,
    "strengths": ["Strong backend experience", "Led cross-functional teams"],
    "concerns": ["No TypeScript mentioned", "Short tenures at last two roles"],
    "summary": "Solid mid-senior engineer with 5 years of Node.js experience...",
    "recommendedDecision": "advance",
    "provider": "claude",
    "promptVersion": "v1",
    "errorMessage": null,
    "createdAt": "2026-03-11T10:01:00.000Z",
    "updatedAt": "2026-03-11T10:01:05.000Z"
  }
]
```

---

### GET /candidates/:candidateId/summaries/:summaryId

Retrieve a single summary by ID.

**Request body** — none

**Response codes**

| Code | Reason |
|---|---|
| `200` | Success |
| `404` | Candidate or summary not found, or outside workspace |

**Response body `200` — completed**
```json
{
  "id": "e5f6g7h8-...",
  "candidateId": "candidate-1",
  "status": "completed",
  "score": 82,
  "strengths": ["Strong backend experience", "Led cross-functional teams"],
  "concerns": ["No TypeScript mentioned", "Short tenures at last two roles"],
  "summary": "Solid mid-senior engineer with 5 years of Node.js experience...",
  "recommendedDecision": "advance",
  "provider": "claude",
  "promptVersion": "v1",
  "errorMessage": null,
  "createdAt": "2026-03-11T10:01:00.000Z",
  "updatedAt": "2026-03-11T10:01:05.000Z"
}
```

**Response body `200` — pending**
```json
{
  "id": "e5f6g7h8-...",
  "candidateId": "candidate-1",
  "status": "pending",
  "score": null,
  "strengths": null,
  "concerns": null,
  "summary": null,
  "recommendedDecision": null,
  "provider": null,
  "promptVersion": null,
  "errorMessage": null,
  "createdAt": "2026-03-11T10:01:00.000Z",
  "updatedAt": "2026-03-11T10:01:00.000Z"
}
```

**Response body `200` — failed**
```json
{
  "id": "e5f6g7h8-...",
  "candidateId": "candidate-1",
  "status": "failed",
  "score": null,
  "strengths": null,
  "concerns": null,
  "summary": null,
  "recommendedDecision": null,
  "provider": null,
  "promptVersion": null,
  "errorMessage": "Claude response failed schema validation: ...",
  "createdAt": "2026-03-11T10:01:00.000Z",
  "updatedAt": "2026-03-11T10:01:03.000Z"
}
```

## Assumptions and Tradeoffs

### Assumptions

- **Recruiter-facing app** — this is assumed to be an internal recruiter-facing tool. Full authentication and authorization flows (JWT, sessions, recruiter/candidate registration) were suppressed in favor of fake auth headers. A non-empty `x-user-id` header is sufficient to pass authentication, and `x-workspace-id` is trusted as-is to scope data access. In a production system, both values would be derived from a verified auth token.

### Tradeoffs

- In-memory queue implementation instead of Redis/BullMQ for simplicity
- Fake auth guard instead of full JWT implementation for assessment purposes

## Project Layout

- `src/auth/`: auth guard, workspace guard, user decorator, auth types
- `src/entities/`: entities
- `src/sample/`: tiny example module (controller/service/dto)
- `src/candidate/`: candidate document and summary workflow endpoints
- `src/queue/`: in-memory queue abstraction
- `src/llm/`: provider interface + fake provider
- `src/migrations/`: TypeORM migration files
- `src/seed/`: seed data for testing