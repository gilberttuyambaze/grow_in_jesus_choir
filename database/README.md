# PostgreSQL schema and migrations

The application reads and writes only to the configured PostgreSQL database. There is no SQLite adapter, local fallback database, or automatic demo-data seed.

## Migrations

Run `pnpm db:migrate` after setting `POSTGRES_DATABASE_URL` or `POSTGRES_DIRECT_URL`. The runner applies ordered SQL files in `migrations/` and records completed migrations in `app_schema_migrations`. Migrations run inside transactions.

The initial migration creates the application tables and role definitions. Later migrations add private document metadata and custom PostgreSQL authentication tables. The schema migration does not insert users, members, categories, financial transactions, audit rows, or notifications.

For later schema changes, add the next numbered migration rather than changing a migration already recorded in an environment. Keep financial amounts as whole-number RWF values and keep critical record changes in the audit log.

## Account provisioning

Use `pnpm auth:provision -- --email address@example.org --name "Full Name" --role MEMBER --voice-part Alto` to create or reset an account. Passwords are entered interactively without echo and stored as scrypt hashes. The command requires a trusted PostgreSQL administrator connection and invalidates the account's existing sessions.

## Storage

Document bytes belong in a private Supabase Storage bucket. Configure its URL, service role key, and bucket name in server-only environment variables. Supabase Auth is not used. If storage is unavailable, uploads/downloads fail instead of falling back to a local directory or mock receipt.
