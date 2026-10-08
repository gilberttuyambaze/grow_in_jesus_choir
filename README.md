# Grow in Jesus Choir

A financial records and member contribution platform built with Next.js, PostgreSQL, and private document storage.

## Data and authentication

- Supabase PostgreSQL is the only source of application records. The app uses a PostgreSQL connection directly; it does not use SQLite or Supabase Auth.
- Password hashes, login throttling, and revocable user sessions are stored in PostgreSQL and checked by the application server.
- Receipts are stored in a private Supabase Storage bucket. Storage credentials are used only by server routes and never exposed to the browser.
- The repository contains no production or demo account/financial seed data. Lists, reports, and dashboards read the connected database.

## Setup

1. Install dependencies and copy `.env.example` to `.env`.
2. Set `POSTGRES_DATABASE_URL` to the Supabase PostgreSQL pooler URI and `POSTGRES_CA_CERT_PATH` to the downloaded database root CA certificate (for example, `certs/supabase-ca.crt`). Set `POSTGRES_DIRECT_URL` only when your deployment requires a direct URI. The database user needs permission to create and alter the application's tables.
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

## Choir sessions

- Leaders and admins can create draft attendance or contribution sessions, select a public or private audience, and schedule/open/close sessions.
- Attendance uses a rotating QR token. Members must sign in to their own linked active account; the database stores only a hash of the token and rejects duplicate check-ins.
- Attendance penalties and member contributions enter the existing financial review workflow as `needs_review`. They affect official balances and collection progress only after approval.
- Member rosters are snapshotted when a session is scheduled. A private session is visible to leaders and admins; public session summaries do not expose other members' names to members or auditors.
- Session times use `APP_TIME_ZONE` (default `Africa/Kigali`).

Migration `005_session_engine.sql` adds the session tables, financial record links, idempotency constraints, notification event keys, and email outbox. Run `pnpm db:migrate` after deploying the code. Session emails require `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and a scheduler that calls `/api/internal/brevo-outbox` with `Authorization: Bearer $CRON_SECRET`. The endpoint is authenticated; provider credentials and deployment scheduling have not been verified from this repository.

The session engine's unit tests are included in `pnpm test`. These test the domain rules and QR matrix; they do not substitute for database-backed concurrency, browser, or live email-provider checks. See [the session engine audit](doc/session-engine-audit.md) for coverage and verification status.

## Member invitations and communications

- Leaders and admins can invite a person as a Member, Leader, or Admin (Member is selected by default). Invitation links use random, single-use tokens stored only as hashes, have a selectable expiry, and create the assigned account role and profile when accepted.
- Leaders and admins can send branded plain-text communications to one active Member, selected active Members, all active Members (up to 500), or one manually entered email. Group messages are sent individually to protect recipient addresses.
- Invitation and communication messages use the server-side Brevo outbox. Configure `APP_URL`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, optional `BREVO_SENDER_NAME`, and `CRON_SECRET`; schedule authenticated calls to `/api/internal/brevo-outbox` to process queued messages. `SENT` means Brevo accepted the request; this app does not yet process delivered or bounced webhooks.
- Migration `006_member_invitation_communications.sql` creates the invitation, campaign, per-recipient delivery and outbox fields. `pnpm db:migrate` applies it to the configured PostgreSQL database.
- See [the invitation and communication audit](doc/member-invitation-communication-audit.md) for workflow behavior, limits, test coverage, and remaining end-to-end checks.

## Security notes

- Financial values are stored as integer Rwandan Francs.
- Application sessions are opaque random tokens. Only SHA-256 token digests are stored in PostgreSQL; session role and user details are loaded from the database on each request.
- Production cookies are `HttpOnly`, `Secure`, `SameSite=Strict`, and use the `__Host-` prefix by default.
- Passwords are hashed with Node's scrypt implementation. Failed logins are throttled in PostgreSQL; password changes revoke all existing sessions.
- Database outages fail closed. The app does not read stale local data or write to a second database.
# grow_in_jesus_choir
