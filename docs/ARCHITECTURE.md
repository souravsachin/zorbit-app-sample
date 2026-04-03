# Architecture — How This Module Connects to the Platform

## Service Mesh

```
                    +------------------+
                    | zorbit-identity  |
                    | (JWT issuer)     |
                    +--------+---------+
                             |
                     JWT validation
                             |
+----------------+   +------v---------+   +------------------+
| Unified Console|-->| zorbit-app-    |-->| zorbit-pii-vault |
| (React SPA)   |   | sample         |   | (PII storage)    |
+----------------+   | (this module)  |   +------------------+
                     +------+---------+
                            |
                     Kafka events
                            |
                     +------v---------+
                     | zorbit-audit   |
                     | (event trail)  |
                     +----------------+
```

## Communication Patterns

| From | To | Protocol | Purpose |
|------|----|----------|---------|
| Client | This module | REST + JWT | CRUD operations |
| This module | PII Vault | REST + JWT | Tokenize/detokenize PII |
| This module | Kafka | Event | Domain events (task.created, etc.) |
| Audit service | Kafka | Event | Consumes events for audit trail |
| This module | MongoDB | TCP | Data persistence |

## Key Design Decisions

1. **MongoDB over PostgreSQL** — Flexible schema for task metadata and tags. PostgreSQL is equally valid (see sample-customer-service).

2. **PII Vault for assignee data** — Name and email are PII. We store tokens, not raw values. This is a core Zorbit compliance pattern.

3. **Optional Kafka** — Events are published when available, logged when not. Business logic never depends on Kafka being up.

4. **Shared JWT secret** — No service-to-service auth calls needed for token validation. Each service verifies JWTs locally using the shared secret.

5. **Standard list endpoint** — The GET / endpoint returns `{ data, total, page, limit, totalPages }` which is the contract expected by ZorbitDataTable.
