# API Reference

Base URL: `http://localhost:3040`
Swagger UI: `http://localhost:3040/api-docs`

All endpoints except health require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Tasks

### List Tasks (Standard List Endpoint)

```
GET /api/v1/O/:orgId/tasks
```

Query parameters:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |
| sortBy | string | createdAt | Sort field |
| sortOrder | asc/desc | desc | Sort direction |
| status | string | | Filter: todo, in_progress, review, done (comma-separated) |
| priority | string | | Filter: low, medium, high, critical (comma-separated) |
| assigneeHashId | string | | Filter by assignee user ID |
| tags | string | | Filter by tags (comma-separated, any match) |
| search | string | | Full-text search across title and description |
| fields | string | | Field projection (comma-separated) |

Response:
```json
{
  "data": [...],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

### Get Task

```
GET /api/v1/O/:orgId/tasks/:taskId
```

Returns the full task document. PII fields (assigneeName, assigneeEmail) are included only if the caller has the `pii:detokenize` privilege.

### Create Task

```
POST /api/v1/O/:orgId/tasks
```

Body:
```json
{
  "title": "Review Q1 report",
  "description": "Check revenue figures",
  "priority": "high",
  "assigneeName": "Jane Smith",
  "assigneeEmail": "jane@company.com",
  "assigneeHashId": "U-81F3",
  "dueDate": "2026-04-15T00:00:00.000Z",
  "tags": ["finance", "quarterly"]
}
```

### Update Task

```
PUT /api/v1/O/:orgId/tasks/:taskId
```

All fields optional. Status transitions are validated:
- todo -> in_progress
- in_progress -> review, todo
- review -> done, in_progress
- done -> todo (reopen)

### Delete Task

```
DELETE /api/v1/O/:orgId/tasks/:taskId
```

Returns 204 No Content.

### Task Statistics

```
GET /api/v1/O/:orgId/tasks/stats
```

Response:
```json
{
  "total": 42,
  "byStatus": { "todo": 15, "in_progress": 12, "review": 8, "done": 7 },
  "byPriority": { "low": 5, "medium": 20, "high": 12, "critical": 5 }
}
```

## Health

```
GET /api/v1/G/sample/health
```

No authentication required. Returns service status and MongoDB connection state.

## Seed

All seed endpoints require authentication.

```
POST   /api/v1/G/sample/seed/demo   — Seed 10 demo tasks
DELETE /api/v1/G/sample/seed/demo   — Remove demo tasks only
DELETE /api/v1/G/sample/seed/all    — Remove ALL tasks (destructive)
```
