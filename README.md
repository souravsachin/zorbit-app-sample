# zorbit-app-sample — Task Management Module

**The official reference implementation for building business modules on the Zorbit platform.**

This repository demonstrates every Zorbit platform integration pattern: JWT authentication, namespace isolation, PII vault tokenization, Kafka event publishing, the standard list endpoint, and frontend integration with the unified console.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Start](#2-quick-start)
3. [Understanding Zorbit Platform Architecture](#3-understanding-zorbit-platform-architecture)
4. [Building Your Backend](#4-building-your-backend)
5. [Building Your Frontend](#5-building-your-frontend)
6. [Registering Your Module](#6-registering-your-module)
7. [Platform Services Reference](#7-platform-services-reference)
8. [Project Structure](#8-project-structure)
9. [Configuration Reference](#9-configuration-reference)

---

## 1. Prerequisites

- **Node.js 20+** and npm
- **MongoDB** (local or Docker: `docker run -d -p 27018:27017 mongo:7`)
- **Access to Zorbit platform services** (identity, PII vault) running locally or on a server
- **JWT_SECRET** matching the platform's identity service
- **Optional:** Kafka for event publishing (gracefully disabled by default)

## 2. Quick Start

```bash
git clone https://github.com/souravsachin/zorbit-app-sample.git
cd zorbit-app-sample
cp .env.example .env
```

Edit `.env` — the critical values are:

```bash
MONGO_URI=mongodb://127.0.0.1:27018/zorbit_sample_tasks?directConnection=true
JWT_SECRET=<must match your zorbit-identity JWT_SECRET>
```

Then:

```bash
npm install
npm run start:dev
```

Open http://localhost:3040/api-docs for Swagger documentation.

### Seed Demo Data

Get a JWT token from the identity service, then:

```bash
curl -X POST http://localhost:3040/api/v1/G/sample/seed/demo \
  -H "Authorization: Bearer <your_jwt_token>"
```

---

## 3. Understanding Zorbit Platform Architecture

### MACH Architecture

Zorbit follows MACH architecture:

- **M**icroservices — each service is independently deployable
- **A**PI-first — all communication via REST APIs
- **C**loud-native — Docker + Kubernetes deployment
- **H**eadless — backend services have no UI; the unified console is separate

### The Service Mesh

Your module runs alongside platform services:

| Service | What It Does | Your Module's Interaction |
|---------|-------------|--------------------------|
| zorbit-identity | Issues JWTs, manages users/orgs | Validate JWTs using shared secret |
| zorbit-authorization | Manages roles and privileges | Check user privileges from JWT payload |
| zorbit-pii-vault | Stores sensitive data as tokens | Tokenize names/emails via REST API |
| zorbit-navigation | Dynamic menu items | Register your module's menu entries |
| zorbit-audit | Event audit trail | Publish events to Kafka (consumed automatically) |
| zorbit-pfs-datatable | Configurable data tables | Register page definitions for your list views |
| zorbit-pfs-form_builder | Config-driven forms | Register form schemas for your create/edit forms |

**Critical rule:** Your module NEVER imports code from platform repos. All integration is via REST APIs or Kafka events.

### Namespace Model

Every API request is scoped to a namespace:

| Namespace | Code | Example | Use Case |
|-----------|------|---------|----------|
| Global | G | /api/v1/G/... | Health checks, seed data, system config |
| Organization | O | /api/v1/O/O-92AF/... | Most business data (tasks, customers, claims) |
| Department | D | /api/v1/D/D-81F3/... | Department-scoped data |
| User | U | /api/v1/U/U-A2C4/... | Personal data (preferences, drafts) |

Your module enforces namespace isolation via the `NamespaceGuard` middleware. A user from org O-AAAA cannot access data belonging to org O-BBBB.

### Short Hash Identifiers

Every entity gets a short hash ID instead of sequential IDs or UUIDs:

```
TSK-A2F3    (task)
CUS-81F3    (customer)
O-92AF      (organization)
U-81F3      (user)
PII-A3B7    (PII token)
```

Properties: immutable, globally unique (best-effort), non-sequential (cannot be guessed).

---

## 4. Building Your Backend

### 4.1 Project Setup (NestJS + MongoDB)

1. Start with a NestJS project: `npx @nestjs/cli new my-module`
2. Install MongoDB support: `npm install @nestjs/mongoose mongoose`
3. Register `MongooseModule.forRootAsync()` in your root `AppModule`
4. Each module gets its own MongoDB database — never share databases

See `src/app.module.ts` for the complete example.

### 4.2 JWT Authentication Middleware

Copy these three files without changes:

- `src/middleware/jwt.strategy.ts` — Passport JWT strategy
- `src/middleware/jwt-auth.guard.ts` — Route protection guard
- `src/middleware/namespace.guard.ts` — Namespace isolation guard

Set `JWT_SECRET` in `.env` to match zorbit-identity's secret.

Apply guards to your controllers:

```typescript
@UseGuards(JwtAuthGuard, NamespaceGuard)
@Controller('api/v1/O/:orgId/tasks')
export class TaskController { ... }
```

After the guards run, `request.user` contains:

```typescript
{
  sub: 'U-81F3',        // User hash ID
  org: 'O-92AF',        // Organization hash ID
  type: 'access',       // Token type
  privileges: ['...']   // User's privileges
}
```

### 4.3 The Standard List Endpoint

This is the most important pattern in Zorbit. Every list endpoint must return:

```typescript
{
  data: T[],
  total: number,
  page: number,
  limit: number,
  totalPages: number
}
```

And support these query parameters:

| Parameter | Purpose | Example |
|-----------|---------|---------|
| page | Page number | ?page=2 |
| limit | Items per page | ?limit=50 |
| sortBy | Sort field | ?sortBy=createdAt |
| sortOrder | Sort direction | ?sortOrder=desc |
| status | Status filter | ?status=todo,in_progress |
| search | Full-text search | ?search=quarterly |
| fields | Field projection | ?fields=hashId,title,status |

See `src/services/task.service.ts` for the complete implementation with MongoDB.

### 4.4 PII Vault Integration

Never store raw PII (names, emails, phone numbers) in your database. Instead:

1. Client sends raw PII in the request body
2. Your service calls PII Vault's `/tokenize` endpoint
3. PII Vault returns an opaque token (e.g., `PII-A3B7`)
4. You store the token in your database
5. To display raw PII, call `/detokenize` (requires `pii:detokenize` privilege)

```typescript
// Tokenize
const token = await this.piiVaultClient.tokenize(
  'email',                    // data type
  'jane@company.com',        // raw value
  'O-92AF',                  // organization
  bearerToken,               // forward JWT for auth
);
// token = 'PII-A3B7'

// Store in your DB
task.assigneeEmailToken = token;  // NOT 'jane@company.com'
```

See `src/services/pii-client.ts` for the REST client implementation.

### 4.5 Kafka Event Publishing

Events follow the naming convention: `domain.entity.action`

```
sample.task.created
sample.task.updated
sample.task.deleted
```

Events use the canonical envelope:

```json
{
  "eventId": "uuid",
  "eventType": "sample.task.created",
  "timestamp": "2026-04-01T12:00:00.000Z",
  "source": "zorbit-app-sample",
  "namespace": "O",
  "namespaceId": "O-92AF",
  "payload": { "taskHashId": "TSK-A2F3", "title": "..." }
}
```

Kafka is optional. Set `KAFKA_ENABLED=false` (default) to log events to console instead.

See `src/events/event-publisher.service.ts` for the implementation.

---

## 5. Building Your Frontend

Frontend pages live in the `frontend/` folder and are designed to be copied into `zorbit-unified-console`.

### 5.1 Page Types

| Page Type | Purpose | Example |
|-----------|---------|---------|
| ListPage | Paginated data table with filters | TaskListPage.tsx |
| DetailPage | Read-only single record view | TaskDetailPage.tsx |
| CreatePage | Form for new records | TaskCreatePage.tsx |
| EditPage | Form for editing existing records | TaskEditPage.tsx |
| HubPage | Module guide (6-tab overview) | TaskHubPage.tsx |
| SetupPage | Seed/flush data management | TaskSetupPage.tsx |
| DeploymentsPage | Deployment history | TaskDeploymentsPage.tsx |

### 5.2 Config-Driven Forms

Instead of hand-coding forms, you can use the FormBuilder service:

1. Define your form schema in `frontend/config/form-schema.json`
2. Register it via `scripts/register-forms.sh`
3. Use `<FormRenderer formId="sample-task-form" />` from zorbit-sdk-react

### 5.3 DataTable Integration

For the standard list page:

1. Define the page in `frontend/config/datatable-page.json`
2. Register it via `scripts/register-datatable.sh`
3. Use `<ZorbitDataTable shortname="sample-tasks" />` from zorbit-sdk-react

Or implement the list page manually (as shown in TaskListPage.tsx).

### 5.4 Module Hub Page

Every module should have a Hub page using `ModuleHubPage`:

```tsx
<ModuleHubPage
  moduleId="sample-tasks"
  moduleName="Task Management"
  icon={CheckSquare}
  capabilities={[...]}
  lifecycleStages={[...]}
  faqs={[...]}
/>
```

This provides 6 tabs: Introduction, Presentation, Lifecycle, Videos, Resources, Pricing.

### 5.5 Integration Steps

See `frontend/README.md` for the complete step-by-step integration guide, or `frontend/routes.tsx` for the route definitions and code snippets.

---

## 6. Registering Your Module

After deploying your backend, register it with the platform:

### 6.1 Menu Items (Navigation Service)

```bash
export JWT_TOKEN="<your_token>"
export NAV_URL="http://localhost:3103"
bash scripts/register-menu.sh
```

This creates sidebar entries for your module in the unified console.

### 6.2 DataTable Page Definition

```bash
export DATATABLE_URL="http://localhost:3113"
bash scripts/register-datatable.sh
```

### 6.3 FormBuilder Form Definition

```bash
export FORM_BUILDER_URL="http://localhost:3114"
bash scripts/register-forms.sh
```

### 6.4 Deployment

See `docs/DEPLOYMENT.md` for the full step-by-step deployment guide covering:
- Building and transferring to server
- PM2 configuration
- Nginx proxy setup
- Environment configuration
- Verification steps

---

## 7. Platform Services Reference

| Service | Dev Port | Server Port | Purpose | Key Endpoints |
|---------|----------|-------------|---------|--------------|
| Identity | 3001 | 3099 | Auth, users, orgs | POST /auth/login, GET /users |
| Authorization | 3002 | 3102 | Roles, privileges | GET /roles, GET /privileges |
| Navigation | 3003 | 3103 | Menu items, routes | POST /menu-items, GET /menu |
| Event Bus | 3004 | 3104 | Kafka messaging | GET /health |
| PII Vault | 3005 | 3105 | PII tokenization | POST /tokenize, POST /detokenize |
| Audit | 3006 | 3106 | Event audit trail | GET /events |
| DataTable | 3013 | 3113 | Configurable tables | POST /pages, GET /query/:shortname |
| FormBuilder | 3014 | 3114 | Config-driven forms | POST /forms, GET /forms/:formId |
| **This Module** | **3040** | **3140** | **Sample tasks** | **GET /api/v1/O/:org/tasks** |

---

## 8. Project Structure

```
zorbit-app-sample/
├── README.md               This file
├── CLAUDE.md               AI agent instructions
├── package.json            Dependencies and scripts
├── tsconfig.json           TypeScript configuration
├── nest-cli.json           NestJS CLI configuration
├── .env.example            Environment variable reference
├── .gitignore              Git ignore rules
├── ecosystem.config.js     PM2 deployment configuration
│
├── src/                    BACKEND SOURCE CODE
│   ├── main.ts             Bootstrap (port, CORS, Swagger)
│   ├── app.module.ts       Root module registration
│   ├── config/
│   │   ├── zorbit.config.ts    Platform service URLs
│   │   └── kafka.config.ts     Kafka configuration
│   ├── middleware/
│   │   ├── jwt.strategy.ts     JWT validation (copy to your module)
│   │   ├── jwt-auth.guard.ts   Route protection (copy to your module)
│   │   └── namespace.guard.ts  Namespace isolation (copy to your module)
│   ├── models/
│   │   ├── schemas/
│   │   │   └── task.schema.ts  MongoDB schema with PII markers
│   │   └── dto/
│   │       ├── create-task.dto.ts  Request validation
│   │       └── update-task.dto.ts  Request validation
│   ├── services/
│   │   ├── task.service.ts     CRUD + standard list + PII integration
│   │   ├── pii-client.ts       REST client for PII Vault
│   │   ├── hash-id.service.ts  Short hash ID generation
│   │   └── seed.service.ts     Demo data management
│   ├── controllers/
│   │   ├── task.controller.ts  REST API endpoints with Swagger
│   │   ├── health.controller.ts Health check (unauthenticated)
│   │   └── seed.controller.ts  Demo data endpoints
│   ├── events/
│   │   ├── task-events.ts      Event type constants + envelope
│   │   └── event-publisher.service.ts Kafka publisher
│   └── modules/
│       ├── auth.module.ts      JWT auth setup
│       ├── events.module.ts    Kafka publisher module
│       ├── task.module.ts      Business logic module
│       ├── health.module.ts    Health check module
│       └── seed.module.ts      Seed data module
│
├── frontend/               FRONTEND PAGES (copy to unified console)
│   ├── README.md           Integration guide
│   ├── pages/
│   │   ├── TaskListPage.tsx      Standard list with filters
│   │   ├── TaskCreatePage.tsx    Create form with PII fields
│   │   ├── TaskEditPage.tsx      Edit form with status transitions
│   │   ├── TaskDetailPage.tsx    Read-only detail view
│   │   ├── TaskHubPage.tsx       Module guide (6-tab hub)
│   │   ├── TaskSetupPage.tsx     Seed/flush data management
│   │   └── TaskDeploymentsPage.tsx  Deployment history
│   ├── config/
│   │   ├── form-schema.json      FormBuilder form definition
│   │   ├── datatable-page.json   DataTable page definition
│   │   └── datatable-fields.json DataTable field visibility
│   └── routes.tsx           Route definitions for App.tsx
│
├── scripts/                REGISTRATION AND SEEDING
│   ├── register-menu.sh    Register menu items in navigation
│   ├── register-forms.sh   Register form in FormBuilder
│   ├── register-datatable.sh  Register page in DataTable
│   └── seed-demo.sh        Seed demo data
│
├── docs/                   DOCUMENTATION
│   ├── ARCHITECTURE.md     Service mesh diagram
│   ├── API.md              Endpoint reference
│   └── DEPLOYMENT.md       Step-by-step deployment guide
│
└── tests/                  UNIT TESTS (TODO)
```

---

## 9. Configuration Reference

See `.env.example` for all configurable values with documentation.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 3040 | Service port |
| NODE_ENV | No | development | Environment |
| MONGO_URI | Yes | - | MongoDB connection string |
| JWT_SECRET | Yes | - | Must match zorbit-identity |
| PII_VAULT_SERVICE_URL | No | http://localhost:3105 | PII Vault URL |
| KAFKA_ENABLED | No | false | Enable Kafka publishing |
| KAFKA_BROKER | No | localhost:9092 | Kafka broker address |
| CORS_ORIGINS | No | http://localhost:5173 | Allowed CORS origins |
