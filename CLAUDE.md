# Zorbit Service: zorbit-app-sample

## Purpose

This repository is the **reference implementation** for building business modules on the Zorbit platform. It implements a Task Management module that demonstrates every platform integration pattern an external developer needs to understand.

This is a **business application** built ON the platform, NOT a core platform service. It does NOT import code from any platform repository — it communicates with platform services exclusively via REST APIs and Kafka events.

## Responsibilities

- Task CRUD operations within an organization namespace
- PII tokenization of assignee name/email via zorbit-pii-vault REST API
- Publishing domain events to Kafka (gracefully disabled when Kafka is unavailable)
- Demonstrating namespace-isolated multi-tenancy (Organization scope)
- Demonstrating short hash identifier pattern (TSK-XXXX)
- Implementing the standard list endpoint (pagination, sort, filter, search, fields)
- Status workflow with validated transitions (todo -> in_progress -> review -> done)
- Demo data seeding and cleanup
- Frontend pages for the unified console (list, detail, create, edit, hub, setup)

## Architecture Context

This service follows Zorbit platform architecture.

Key rules:

- REST API grammar: /api/v1/O/:orgId/tasks
- namespace-based multi-tenancy (Organization scope)
- short hash identifiers (TSK-XXXX)
- event-driven integration (sample.task.created, etc.)
- service isolation — NO cross-service code imports
- PII vault integration — raw PII never stored in operational DB
- MongoDB for flexible document storage

## Dependencies

Allowed dependencies:

- zorbit-identity (JWT authentication — shared secret, no API calls needed)
- zorbit-pii-vault (PII tokenization/detokenization via REST)
- zorbit-event_bus (Kafka event publishing)

Forbidden dependencies:

- direct database access to other services
- cross-service code imports
- importing from zorbit-sdk-node or any platform repo

## Platform Dependencies

Upstream services:
- zorbit-identity (JWT validation via shared secret)
- zorbit-pii-vault (PII tokenization via REST API)
- zorbit-event_bus (Kafka infrastructure)

Downstream consumers:
- zorbit-audit (task events for audit trail)
- zorbit-unified-console (frontend pages)

## Repository Structure

- /src/main.ts — Application bootstrap (port, CORS, Swagger)
- /src/app.module.ts — Root module registration
- /src/config/ — Platform service URLs and Kafka configuration
- /src/middleware/ — JWT strategy, auth guard, namespace guard
- /src/models/schemas/ — Mongoose schema with PII markers
- /src/models/dto/ — Request validation DTOs
- /src/services/ — Business logic (TaskService, PiiVaultClient, HashIdService, SeedService)
- /src/controllers/ — REST API endpoints (TaskController, HealthController, SeedController)
- /src/events/ — Kafka event publisher and event type constants
- /src/modules/ — NestJS module definitions
- /frontend/ — React pages and config files for zorbit-unified-console
- /scripts/ — Registration and seeding shell scripts
- /docs/ — Architecture, API, and deployment documentation

## Running Locally

```bash
npm install
cp .env.example .env
# Edit .env — set MONGO_URI, JWT_SECRET (must match identity service)
npm run start:dev
```

Service runs on port 3040 (default). Production/server: port 3140.
Swagger docs: http://localhost:3040/api-docs

## Events Published

- sample.task.created
- sample.task.updated
- sample.task.deleted
- sample.task.status_changed

## Events Consumed

None.

## API Endpoints

### Tasks (authenticated, namespace-scoped)
- GET    /api/v1/O/:orgId/tasks — Standard list endpoint (pagination, sort, filter, search)
- GET    /api/v1/O/:orgId/tasks/stats — Task statistics by status and priority
- GET    /api/v1/O/:orgId/tasks/:taskId — Get task (PII detokenized if privileged)
- POST   /api/v1/O/:orgId/tasks — Create task (PII tokenized via vault)
- PUT    /api/v1/O/:orgId/tasks/:taskId — Update task (status transitions validated)
- DELETE /api/v1/O/:orgId/tasks/:taskId — Delete task

### Health (unauthenticated)
- GET    /api/v1/G/sample/health — Health check

### Seed (authenticated)
- POST   /api/v1/G/sample/seed/demo — Seed demo tasks
- DELETE /api/v1/G/sample/seed/demo — Flush demo tasks
- DELETE /api/v1/G/sample/seed/all — Flush ALL tasks

## Development Guidelines

Follow Zorbit architecture rules. This module is the reference implementation — every file should be educational with clear comments explaining WHY, not just WHAT.
