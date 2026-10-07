# PostgreSQL schema and migrations

The application reads and writes only to the configured PostgreSQL database. There is no SQLite adapter, local fallback database, or automatic demo-data seed.

## Migrations

Run `pnpm db:migrate` after setting `POSTGRES_DATABASE_URL` and `POSTGRES_CA_CERT_PATH` to your Supabase pooler URI and downloaded root CA certificate. The runner applies ordered SQL files in `migrations/` and records completed migrations in `app_schema_migrations`. Migrations run inside transactions with TLS certificate verification enabled.

The initial migration creates the application tables and role definitions. Later migrations add private document metadata, custom PostgreSQL authentication tables, member onboarding progress, choir sessions with attendance and QR token hashes, and the invitation/communication workflows with per-recipient delivery records. The schema migrations do not insert users, members, categories, financial transactions, audit rows, or notifications.

For later schema changes, add the next numbered migration rather than changing a migration already recorded in an environment. Keep financial amounts as whole-number RWF values and keep critical record changes in the audit log.

Migration `005_session_engine.sql` was applied successfully to the configured PostgreSQL database. Re-running `pnpm db:migrate` skips all applied migrations. Session contribution and penalty records start as `needs_review`; only approved (`recorded`) rows count toward official income.

Migration `006_member_invitation_communications.sql` adds Member-only invitations, hashed single-use invite tokens, communication history, per-recipient delivery state, and invitation/communication links on the email outbox. Invitation acceptance creates the user, Member profile, welcome notification, and audit event in one PostgreSQL transaction. Run `pnpm db:migrate` after deploying this migration.

## Account provisioning

Use `pnpm auth:provision -- --email address@example.org --name "Full Name" --role MEMBER --voice-part Alto` to create or reset an account. Passwords are entered interactively without echo and stored as scrypt hashes. The command requires a trusted PostgreSQL administrator connection and invalidates the account's existing sessions.

## Storage

Document bytes belong in a private Supabase Storage bucket. Configure its URL, service role key, and bucket name in server-only environment variables. Supabase Auth is not used. If storage is unavailable, uploads/downloads fail instead of falling back to a local directory or mock receipt.

## Email delivery

Session events, invitations, and member communications use PostgreSQL's durable outbox. Set `APP_URL` to the public HTTPS app URL for invitation links; set `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, optional `BREVO_SENDER_NAME`, and `CRON_SECRET`; then configure the hosting scheduler to call `/api/internal/brevo-outbox` using `Authorization: Bearer <CRON_SECRET>`. Live provider delivery and host scheduling are `NOT VERIFIED` until configured in the deployment environment. `SENT` records provider acceptance, not inbox delivery; delivered/bounced webhooks are not implemented.

See `doc/member-invitation-communication-audit.md` for security boundaries, rate limits, workflow states, test coverage, and end-to-end verification gaps.
