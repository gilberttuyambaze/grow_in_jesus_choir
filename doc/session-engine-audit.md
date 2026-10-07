# Session engine implementation and verification audit

Status date: 2026-10-08

This records implementation evidence for the attendance, QR check-in, penalties, and contribution sessions work. Status labels are used literally: `MISSING` means the capability is not implemented, `NOT VERIFIED` means the capability cannot be confirmed from this workspace, and `MOCK/DEMO` means a check used simulated data. No simulated session or financial records were inserted into the choir database.

## Phase review

| Phase | Status | Evidence and limits |
| --- | --- | --- |
| 01 — Product Discovery & Requirements | READY_FOR_REVIEW | The implementation encodes the session types, lifecycle, visibility, deadlines, attendance grace, collection targets, member progress, and approval rules described in the session requirements. The choir has not separately signed off on these rules. |
| 03 — Database & Data Model | IMPLEMENTED; migration applied | `database/migrations/005_session_engine.sql` adds sessions, roster snapshots, session links on financial records, unique idempotency indexes, notification event keys, and the email outbox. `pnpm db:migrate` completed successfully; a subsequent run skipped migrations 001–005 as already applied. |
| 06 — Authentication & Authorization | IMPLEMENTED; live role behavior NOT VERIFIED | Session actions require the existing PostgreSQL-backed application session. Server actions check leader/admin permissions; member actions use the signed-in user's linked active member row. Supabase Auth is not used. Automated checks cover visibility rules, but do not simulate forged browser requests against a live server. |
| 07 — Member Experience | IMPLEMENTED; browser flow NOT VERIFIED | Session list/detail pages, signed-in QR check-in, contribution submission, own attendance/contribution status, notifications, and member session history are present. A browser/device scan test was not run. |
| 08 — Leader Financial Management | IMPLEMENTED; database concurrency NOT VERIFIED | Contributions and attendance penalties are linked to the existing RWF financial ledger with `needs_review` status. Only `recorded` entries count toward official totals. Closing an attendance session finalizes unchecked members and inserts each penalty at most once through a database unique index. Parallel requests were not exercised against PostgreSQL. |
| 09 — Dashboard & Analytics | IMPLEMENTED; live data result NOT VERIFIED | Session detail views show attendance counts, approved/pending/rejected collections, target progress, and member-level progress for managers. No production-like session data was created to validate these figures. |
| 10 — Reports, Documents & Notifications | IMPLEMENTED; delivery NOT VERIFIED | Session events create in-app notifications and transactional rows in a PostgreSQL outbox. A protected `/api/internal/brevo-outbox` endpoint sends through Brevo when configured. `BREVO_API_KEY`, sender credentials, `CRON_SECRET`, hosting scheduler configuration, and actual provider delivery are `NOT VERIFIED`. |
| 12 — Security, Accessibility & Performance | READY_FOR_REVIEW | QR tokens are random and stored as SHA-256 hashes, comparisons are constant-time, check-in is tied to the signed-in member, private visibility is checked server-side, financial changes are audited, and inputs are validated. An independent security review, accessibility audit, load test, and database-backed race test are `NOT VERIFIED`. |
| 13 — Full Testing & Production Readiness | PARTIALLY VERIFIED | `pnpm test` passed 8 test-file suites, including 32 session-rule cases, 2 QR encoder checks, and 2 session-time checks. `pnpm exec tsc --noEmit` passed. The unit suite does not cover live SQL, authorization over HTTP, browser behavior, email delivery, or concurrent sessions. The production build is blocked in this environment. |

## Session behavior

- A scheduled session snapshots active members. Private sessions are visible to leaders and admins; public members see their own roster row and public summaries only.
- Attendance check-in is accepted only while the session is open, at or after its start, through its configured deadline, with a valid QR token and a rostered signed-in member. The first check-in is idempotent; repeat scans return the stored status.
- Check-ins are `PRESENT` through the grace boundary and `LATE` after it. An unchecked member remains unconfirmed until close/finalization, when they become `ABSENT`.
- Late and absence penalties use the configured RWF values and are inserted as `needs_review`. They do not affect official balances until approved.
- Contribution submissions are accepted only while open and through the deadline. They are idempotent by member and request key and start as `needs_review`. Pending, rejected, or voided amounts do not increase the approved collection target progress.
- Session times are parsed and displayed in `APP_TIME_ZONE`, defaulting to `Africa/Kigali`. The attendance deadline is the last accepted scan; the contribution deadline is the last accepted submission.

## Test coverage

`tests/session_engine.test.mjs` covers:

1. On-time attendance and grace boundaries.
2. Late attendance.
3. Unchecked members remain unconfirmed before finalization.
4. Finalization changes unchecked members to absent.
5. Duplicate scans do not create another check-in.
6. Closed sessions reject check-ins.
7. Non-rostered users cannot check in another member.
8–10. Late/absence penalties and per-session settings.
11–14. Pending/rejected penalties, approved totals, and duplicate finalization protection.
15–17. Attendance-only behavior and contribution-specific type rules.
18–23. Pending/approved/rejected contribution totals, member status, target progress.
24–27. Public/private visibility and guessed-identifier access.
28–30. Contribution deadlines and idempotency.
31–32. Lifecycle transitions, invalid QR token, and check-in start/deadline windows.

`tests/session_qr.test.mjs` checks the generated version 10-L QR matrix against a known reference digest and rejects oversized payloads. These are domain/encoder unit tests, not end-to-end scans or database integration tests.

## Verification record

- `pnpm db:migrate`: **PASS**. Migration 005 applied, and the follow-up run reported migrations 001–005 already applied. This resolves the reported `column r.session_id does not exist` error in the configured database schema.
- `pnpm test`: **PASS** — all test-file suites passed, including 32 session-rule cases, 2 QR encoder cases, and 2 time-zone cases.
- `pnpm exec tsc --noEmit`: **PASS**.
- `pnpm build`: **NOT VERIFIED**. Turbopack could not bind a worker port under the sandbox (`Operation not permitted`). The Webpack build stopped because Next.js could not parse TypeScript `--showConfig` output, although the direct TypeScript check passed. This is an environment/toolchain build failure, not evidence of a successful production build.
- Database-backed 27-case integration/concurrency run: **NOT VERIFIED**. No test records were written to the live choir database.
- Real QR scan from a phone/browser: **NOT VERIFIED**.
- Brevo email delivery and scheduled invocation in the deployment host: **NOT VERIFIED**.

## Missing and external setup

- No separate database integration test suite is present: **MISSING**.
- Deployment-side Brevo credentials and a scheduler for `/api/internal/brevo-outbox` must be configured: **NOT VERIFIED**.
- Browser and real QR scanning checks remain **NOT VERIFIED**.
