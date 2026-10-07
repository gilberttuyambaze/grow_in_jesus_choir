# Database Architecture & Migration Guide

## Directory Structure

```text
database/
├── migrations/         # Sequential, immutable SQL migrations (e.g., 001_initial_schema.sql)
├── seeds/              # Development and staging seed scripts
├── functions/          # Database helper routines
├── triggers/           # Triggers for audit logging and timestamp updates
├── views/              # Reporting and aggregate views
└── README.md           # This document
```

## Migration Rules

1. **Sequential Naming**: Every migration is numbered in order (e.g. `001_initial_schema.sql`, `002_roles_and_users.sql`, `003_financial_categories.sql`).
2. **Immutability**: Never modify a migration that has already been executed in an environment. Create a new sequential migration instead.
3. **Idempotence**: Migrations must safely handle `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.
4. **Exact Monetary Values**: All financial amounts are stored as integers representing minor currency units (e.g. RWF whole units without floating-point inaccuracies).
5. **Audit Trails**: Critical changes to financial records must generate an entry in the `audit_logs` table recording the actor, action, timestamp, and delta.

