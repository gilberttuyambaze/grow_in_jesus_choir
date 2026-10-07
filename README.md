# Grow in Jesus Choir

A financial records and member contribution platform built with Next.js, PostgreSQL, and private document storage.

## Data and authentication

- Supabase PostgreSQL is the only source of application records. The app uses a PostgreSQL connection directly; it does not use SQLite or Supabase Auth.
- Password hashes, login throttling, and revocable user sessions are stored in PostgreSQL and checked by the application server.
- Receipts are stored in a private Supabase Storage bucket. Storage credentials are used only by server routes and never exposed to the browser.
- The repository contains no production or demo account/financial seed data. Lists, reports, and dashboards read the connected database.

## Setup

1. Install dependencies and copy `.env.example` to `.env`.
2. Set `POSTGRES_DATABASE_URL` to the Supabase PostgreSQL pooler URI. Set `POSTGRES_DIRECT_URL` when your deployment requires a direct URI for migrations. The database user needs permission to create and alter the application's tables.
3. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` for the private document bucket. Do not add the service role key to any `NEXT_PUBLIC_*` variable.
4. Apply the PostgreSQL schema with `pnpm db:migrate`.
5. Provision the first account with `pnpm auth:provision -- --email admin@example.org --name "Choir Administrator" --role ADMIN` and follow the hidden password prompts. Use `--role MEMBER --voice-part Soprano` when creating a choir member account.
6. Start the app with `pnpm dev`.

The provisioning command creates or updates an account and revokes its existing sessions. Run it only from a trusted administrator machine. Existing legacy accounts need a new password provisioned before they can use the current scrypt password format.

## Roles

- **Member**: sees and submits their own contribution records and documents.
- **Leader**: manages choir members, records, approvals, reports, and audit history.
- **Admin**: has the leader permissions used by the application.
- **Auditor**: has read-only access to organization financial records, reports, documents, and audit history.

## Security notes

- Financial values are stored as integer Rwandan Francs.
- Application sessions are opaque random tokens. Only SHA-256 token digests are stored in PostgreSQL; session role and user details are loaded from the database on each request.
- Production cookies are `HttpOnly`, `Secure`, `SameSite=Strict`, and use the `__Host-` prefix by default.
- Passwords are hashed with Node's scrypt implementation. Failed logins are throttled in PostgreSQL; password changes revoke all existing sessions.
- Database outages fail closed. The app does not read stale local data or write to a second database.
