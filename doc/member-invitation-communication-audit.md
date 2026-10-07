# Member Invitation and Communication Audit

**Scope:** repository implementation plus migration 006 applied to the configured PostgreSQL database. This is a code and database-schema audit; no real email was sent and no browser-to-database end-to-end run was performed.

## Member invitation

| Area | Status | Evidence and limits |
| --- | --- | --- |
| Invitation UI | PARTIAL | Leader/Admin page has required name, email and voice part, optional phone and note, allowed expiry choices, status history, resend, cancel confirmation, busy and error states. Browser and mobile behavior were not exercised. |
| Invitation backend | PARTIAL | Server actions load the current DB-backed session and require Leader/Admin. Actions validate form fields and call transactional PostgreSQL workflows. Direct forged server-action requests were not run against a live app. |
| Invitation database | VERIFIED | Migration 006 was applied. It adds invitation lifecycle fields, token hash, expiry, accepted account/member links, audit references and a partial unique index for active invitations by normalized email. |
| Invitation token security | PARTIAL | A 32-byte cryptographic random token is encoded base64url; only its SHA-256 digest is stored. Acceptance hashes the supplied token and locks/rechecks the row. Unit tests check the token shape and state rules, but no adversarial database-backed test was run. |
| Invitation expiration | PARTIAL | Expiry is stored in PostgreSQL; lookup and acceptance check against PostgreSQL `NOW()`. Expired tokens are cleared and queued messages cancelled. End-to-end expiry and concurrency were not exercised. |
| Role assignment | VERIFIED | The form and server action accept no role field. The database constrains `invited_role` to `MEMBER`, and acceptance loads the `MEMBER` role from PostgreSQL and creates the account/member in one transaction. |
| Brevo integration | PARTIAL | Server-only worker calls Brevo's transactional email API with server environment credentials. Missing configuration leaves jobs queued; failures retry up to eight attempts. Live credentials, sender verification and provider responses were not tested. |
| Invitation email | PARTIAL | Inline, table-based HTML includes the choir logo, diamond motif, CTA, inviter/note, expiry and footer; text fallback is included and dynamic values are escaped. Rendering in real email clients and receipt were not checked. |
| Invitation audit | PARTIAL | Create, resend, accepted, cancelled, expired, send accepted and terminal send failure events are recorded without tokens. Database event rows were not inspected after a live workflow. |
| Invitation testing | PARTIAL | Unit coverage checks token acceptance rules, role helper, email validation and template escaping. Full DB-backed invitation, direct authorization, browser and email-provider tests remain outstanding. |

### Invitation behavior

- **Who can invite:** Leader and Admin only, enforced in server actions and the page. Member and Auditor are denied by the role check.
- **Required information:** email, full name and voice part (Soprano, Alto, Tenor or Bass); phone and personal note are optional. Expiry is one, three, seven or fourteen days.
- **Duplicates:** an existing account is rejected; an active invitation is rejected with a prompt to use Resend. Expired/cancelled invitations do not block a new invitation if no account exists. Accepted invitations cannot be reused because the token is cleared and the account exists.
- **Resend/cancel:** resend is limited to five per invitation, one-minute cooldown, five per email per day and twenty invitation actions per actor per hour. Resend rotates the token and invalidates the old generation. Cancel clears the token and cancels queued mail. A provider request already in flight cannot be recalled, but its link becomes invalid.
- **Delivery state:** new invitations are `PENDING`; Brevo API acceptance moves the current generation to `SENT`; terminal provider failure moves it to `FAILED`; acceptance, expiry and cancellation have their own terminal states. `SENT` means accepted by Brevo, not confirmed in an inbox.

## Member communication

| Area | Status | Evidence and limits |
| --- | --- | --- |
| Communication UI | PARTIAL | Leader/Admin page supports audience selection, subject/body, optional importance/in-app notification, preview, all-member confirmation, progress/error feedback and recipient history. Browser/mobile behavior was not exercised. |
| Single-member communication | PARTIAL | Server resolves the selected active member and sends one individual email. No database-backed send test was run. |
| Selected-member communication | PARTIAL | Server resolves and validates all submitted IDs against active Member accounts, rejects ineligible/invalid selected records and deduplicates normalized emails. No integration test was run. |
| All-member communication | PARTIAL | Server derives the active Member audience from PostgreSQL, skips invalid addresses with a count, caps the full active audience at 500 and requires explicit confirmation. The UI shows the count and prevents over-limit sends. No live send was run. |
| Manual-email communication | PARTIAL | One normalized, validated address per campaign, optional display name. The route remains Leader/Admin-only with shared hourly rate limits. No live provider send was run. |
| Authorization | PARTIAL | Page and server action both require Leader/Admin from the current session. Pure role-helper tests exist; direct forged action requests for every role were not exercised. |
| Recipient validation | PARTIAL | Email syntax/length, selected active-member eligibility, count limits and case-insensitive deduplication are checked server-side. Unit tests cover validation/dedup helpers, not DB rows. |
| Mass-send safeguards | PARTIAL | Preview and confirmation; 500-recipient limit; three group sends and twenty total communications per sender/hour; advisory transaction lock prevents concurrent rate-limit bypass; individual sends avoid exposing other addresses. No stress test was run. |
| Brevo integration | PARTIAL | Server-only worker sends one recipient per Brevo request, in groups of five concurrent requests; tracks provider acceptance/failure and retries. No key or provider response was inspected. |
| Branded email | PARTIAL | Email-safe inline HTML uses the choir logo, diamond motif, responsive table layout and professional footer. Plain text is also provided. User subject/body are escaped and rendered as text; template injection unit tests pass. Real-client rendering is unverified. |
| Delivery tracking | PARTIAL | Per-recipient `QUEUED`, `SENDING`, `SENT`, `FAILED` and campaign `QUEUED`, `SENDING`, `SENT`, `PARTIAL`, `FAILED` are persisted. `SENT` means Brevo accepted the request. `DELIVERED`/`BOUNCED` are not tracked because provider webhooks are not implemented. |
| In-platform notifications | PARTIAL | Optional checkbox creates notifications for selected recipients linked to application users in the same transaction. Manual email recipients cannot receive an in-app notification. Ordinary communications do not create notifications unless selected. |
| Audit logging | PARTIAL | Campaign creation records actor, mode, subject, counts and important/notification flags; completion records sent/failed aggregate results. Per-recipient outcomes are stored separately. Audit rows were not checked after a live send. |
| Communication testing | PARTIAL | Unit tests cover permission helper, address validation, deduplication, rate-limit helper and HTML escaping. DB integration, real provider success/failure, retry, recipient privacy and browser flows were not exercised. |

### Communication behavior

- Member audience modes include one active Member, selected active Members, all active Members, and one manually entered email. Active Members are defined by active member profile, active linked account and `MEMBER` role.
- Selected-member addresses must be valid; invalid records block that send. All-member sends skip invalid addresses and report their number. More than 500 active accounts is rejected rather than silently truncating the audience.
- Each address is sent individually, so a recipient cannot see another recipient's address. Group sends are limited to three per sender per hour; all modes share a twenty-campaign-per-hour limit.
- Message content is plain text; rich text and attachments are not supported. In-app notification is optional, not automatic. History and recipient addresses are visible only on the Leader/Admin page.
- Provider acceptance, failures and retry state are recorded. The system does not claim inbox delivery and does not currently process delivery/bounce webhooks.

## Phase mapping

| Project phase | Audit result |
| --- | --- |
| 01 — Requirements | PARTIAL — this audit records roles, fields, recipient types, delivery semantics and notification behavior; product owner review of recipient scope remains unverified. |
| 02 — Architecture | PARTIAL — invitations and communications are separate workflows over a shared server-side Brevo outbox; no architecture review or deployment scheduler verification was performed. |
| 03 — Database | VERIFIED — migration 006 was applied and adds invitation, campaign, recipient, outbox and lifecycle fields. |
| 06 — Authentication and authorization | PARTIAL — server checks and Member-only account creation are implemented; direct request tests for Member/Leader/Admin were not run. |
| 07 — Member experience | PARTIAL — public invitation acceptance and optional in-app communication notifications exist; real email receipt and browser acceptance were not tested. |
| 08 — Leader experience | PARTIAL — separate invitation and communication pages are role-gated and include history; browser and mobile checks remain outstanding. |
| 10 — Email, notifications and audit | PARTIAL — templates, queue state and audit writes exist; no live Brevo transaction or resulting database event inspection occurred. |
| 12 — Security | PARTIAL — server authorization, hashed random tokens, expiry, rate limits, individual sends and escaped content are present; penetration, concurrency and privacy testing remain. |
| 13 — Testing | PARTIAL — focused unit tests pass; database integration, full E2E, real recipient and provider failure testing remain outstanding. |

## Required end-to-end workflows

**Member invitation:** NOT VERIFIED end to end. Source and database paths cover create → outbox → Brevo attempt → public token lookup → password setup → Member account/profile creation → token consumption → audit. The workflow was not run with a live Leader/Admin session, real recipient, browser, or provider.

**Member communication:** NOT VERIFIED end to end. Source and database paths cover audience selection → preview/confirmation → server authorization → transactional recipient/outbox creation → individual Brevo attempts → delivery-state/history/audit updates. The workflow was not run with a real recipient or provider.

## Test evidence

`pnpm test` and `pnpm exec tsc --noEmit` are the local checks for this change. They do not establish real Brevo delivery or a complete database-backed/browser E2E flow. The audit does not seed fake users or send email to real members.
