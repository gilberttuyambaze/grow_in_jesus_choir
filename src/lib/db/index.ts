import 'server-only'

import crypto from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import pg from 'pg'

const EMBEDDED_SUPABASE_CA = `-----BEGIN CERTIFICATE-----
MIIDxDCCAqygAwIBAgIUbLxMod62P2ktCiAkxnKJwtE9VPYwDQYJKoZIhvcNAQEL
BQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l
dyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh
c2UgUm9vdCAyMDIxIENBMB4XDTIxMDQyODEwNTY1M1oXDTMxMDQyNjEwNTY1M1ow
azELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD
YXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJhc2Ug
Um9vdCAyMDIxIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqQXW
QyHOB+qR2GJobCq/CBmQ40G0oDmCC3mzVnn8sv4XNeWtE5XcEL0uVih7Jo4Dkx1Q
DmGHBH1zDfgs2qXiLb6xpw/CKQPypZW1JssOTMIfQppNQ87K75Ya0p25Y3ePS2t2
GtvHxNjUV6kjOZjEn2yWEcBdpOVCUYBVFBNMB4YBHkNRDa/+S4uywAoaTWnCJLUi
cvTlHmMw6xSQQn1UfRQHk50DMCEJ7Cy1RxrZJrkXXRP3LqQL2ijJ6F4yMfh+Gyb4
O4XajoVj/+R4GwywKYrrS8PrSNtwxr5StlQO8zIQUSMiq26wM8mgELFlS/32Uclt
NaQ1xBRizkzpZct9DwIDAQABo2AwXjALBgNVHQ8EBAMCAQYwHQYDVR0OBBYEFKjX
uXY32CztkhImng4yJNUtaUYsMB8GA1UdIwQYMBaAFKjXuXY32CztkhImng4yJNUt
aUYsMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAB8spzNn+4VU
tVxbdMaX+39Z50sc7uATmus16jmmHjhIHz+l/9GlJ5KqAMOx26mPZgfzG7oneL2b
VW+WgYUkTT3XEPFWnTp2RJwQao8/tYPXWEJDc0WVQHrpmnWOFKU/d3MqBgBm5y+6
jB81TU/RG2rVerPDWP+1MMcNNy0491CTL5XQZ7JfDJJ9CCmXSdtTl4uUQnSuv/Qx
Cea13BX2ZgJc7Au30vihLhub52De4P/4gonKsNHYdbWjg7OWKwNv/zitGDVDB9Y2
CMTyZKG3XEu5Ghl1LEnI3QmEKsqaCLv12BnVjbkSeZsMnevJPs1Ye6TjjJwdik5P
o/bKiIz+Fq8=
-----END CERTIFICATE-----`

function loadCaCertificate(): string | undefined {
  if (process.env.POSTGRES_CA_CERT?.trim()) {
    return process.env.POSTGRES_CA_CERT.trim()
  }
  const caCertPath = process.env.POSTGRES_CA_CERT_PATH?.trim()
  if (caCertPath) {
    try {
      const resolved = path.join(process.cwd(), 'certs', path.basename(caCertPath))
      if (existsSync(resolved)) {
        return readFileSync(resolved, 'utf8')
      }
    } catch {
      // Safe fallback below
    }
  }
  return EMBEDDED_SUPABASE_CA
}
import {
  AuditLogEntry,
  AttendanceStatus,
  ChoirSession,
  ChoirSessionStatus,
  ChoirSessionType,
  ChoirSessionVisibility,
  FinancialCategory,
  FinancialDocument,
  FinancialRecord,
  FinancialRecordType,
  FinancialRecordStatus,
  FinancialSummary,
  Member,
  MemberSessionHistoryItem,
  NotificationItem,
  SessionOverview,
  SessionRosterEntry,
  User,
  UserRole
} from '@/types'
import {
  attendanceStatusAt,
  canTransitionSession,
  classifyContributionMember,
  planAttendanceFinalization,
  hasCheckedIn,
  resolveIdempotentSubmission,
  validateAttendanceCheckIn,
  validateContributionSubmission
} from '@/features/sessions/domain.mjs'
import { sessionDateIso } from '@/lib/utils/zoned-time'

type AuthUser = User & { passwordHash: string }
type SessionUser = User & { expiresAt: number }
const SUPPORTED_ROLES: UserRole[] = ['MEMBER', 'LEADER', 'ADMIN', 'AUDITOR']

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed'

export interface OnboardingProgress {
  status: OnboardingStatus
  currentStep: number
  startedAt: string | null
  completedAt: string | null
  updatedAt: string | null
}

export interface OnboardingUserProgress extends OnboardingProgress {
  userId: string
  fullName: string
  email: string
  role: UserRole
}

const globalForPostgres = globalThis as typeof globalThis & {
  __growInJesusPostgresPool?: pg.Pool
}

export function getPgPool(): pg.Pool {
  if (globalForPostgres.__growInJesusPostgresPool) {
    return globalForPostgres.__growInJesusPostgresPool
  }

  const connectionString =
    process.env.POSTGRES_DATABASE_URL ||
    process.env.POSTGRES_DIRECT_URL ||
    process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('PostgreSQL is not configured. Set POSTGRES_DATABASE_URL.')
  }
  if (!/^postgres(?:ql)?:\/\//i.test(connectionString)) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection string.')
  }

  const caCert = loadCaCertificate()
  const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
  const isSslDisabled = connectionString.includes('sslmode=disable')

  const sslConfig = isLocalhost || isSslDisabled
    ? false
    : {
        rejectUnauthorized: process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED !== 'false',
        ...(caCert ? { ca: caCert } : {})
      }

  const pool = new pg.Pool({
    connectionString,
    ssl: sslConfig,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000
  })
  pool.on('error', (error: any) => {
    console.error('[PostgreSQL pool error]', error?.code || error?.message || 'unknown')
  })

  globalForPostgres.__growInJesusPostgresPool = pool
  return pool
}

function makeId(): string {
  return crypto.randomUUID()
}

function boundedLimit(value: number | undefined, fallback: number, maximum = 500): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(maximum, Math.max(1, Math.floor(value as number)))
}

function toUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role as UserRole,
    fullName: row.fullName,
    avatarInitials: row.avatarInitials,
    createdAt: row.createdAt
  }
}

const USER_SELECT = `
  SELECT u.id, u.email, r.name AS role, u.full_name AS "fullName",
         u.avatar_initials AS "avatarInitials", u.created_at::text AS "createdAt"
  FROM users u
  JOIN roles r ON r.id = u.role_id
`

// -----------------------------------------------------------------------------
// Custom PostgreSQL authentication
// -----------------------------------------------------------------------------

export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  const result = await getPgPool().query(
    `SELECT u.id, u.email, u.password_hash AS "passwordHash", r.name AS role,
            u.full_name AS "fullName", u.avatar_initials AS "avatarInitials",
            u.created_at::text AS "createdAt"
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE LOWER(u.email) = LOWER($1) AND u.is_active = TRUE AND r.name = ANY($2::text[])
     LIMIT 1`,
    [email.trim(), SUPPORTED_ROLES]
  )
  return result.rows[0] ? { ...result.rows[0], role: result.rows[0].role as UserRole } : null
}

export async function upgradeUserPasswordHash(
  userId: string,
  previousHash: string,
  newHash: string
): Promise<boolean> {
  const result = await getPgPool().query(
    `UPDATE users
     SET password_hash = $3, updated_at = NOW()
     WHERE id = $1 AND password_hash = $2 AND is_active = TRUE`,
    [userId, previousHash, newHash]
  )
  return result.rowCount === 1
}

export async function getUserForPasswordChange(userId: string): Promise<AuthUser | null> {
  const result = await getPgPool().query(
    `SELECT u.id, u.email, u.password_hash AS "passwordHash", r.name AS role,
            u.full_name AS "fullName", u.avatar_initials AS "avatarInitials",
            u.created_at::text AS "createdAt"
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1 AND u.is_active = TRUE AND r.name = ANY($2::text[])`,
    [userId, SUPPORTED_ROLES]
  )
  return result.rows[0] ? { ...result.rows[0], role: result.rows[0].role as UserRole } : null
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await getPgPool().query(
    `${USER_SELECT} WHERE u.id = $1 AND u.is_active = TRUE AND r.name = ANY($2::text[])`,
    [id, SUPPORTED_ROLES]
  )
  return result.rows[0] ? toUser(result.rows[0]) : null
}

export async function getOnboardingProgress(
  userId: string,
  tourId: string,
  tourVersion: number
): Promise<OnboardingProgress> {
  const result = await getPgPool().query(
    `SELECT tour_version AS "tourVersion", current_step AS "currentStep", status,
            started_at::text AS "startedAt", completed_at::text AS "completedAt",
            updated_at::text AS "updatedAt"
     FROM user_onboarding_progress
     WHERE user_id = $1 AND tour_id = $2`,
    [userId, tourId]
  )
  const row = result.rows[0]
  if (!row || Number(row.tourVersion) !== tourVersion) {
    return { status: 'not_started', currentStep: 0, startedAt: null, completedAt: null, updatedAt: null }
  }
  return {
    status: row.status as OnboardingStatus,
    currentStep: Number(row.currentStep),
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    updatedAt: row.updatedAt
  }
}

export async function saveOnboardingProgress(
  userId: string,
  tourId: string,
  tourVersion: number,
  currentStep: number,
  status: 'in_progress' | 'completed'
): Promise<void> {
  await getPgPool().query(
    `INSERT INTO user_onboarding_progress
       (user_id, tour_id, tour_version, current_step, status, started_at, completed_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), CASE WHEN $5 = 'completed' THEN NOW() ELSE NULL END, NOW())
     ON CONFLICT (user_id, tour_id) DO UPDATE SET
       tour_version = EXCLUDED.tour_version,
       current_step = EXCLUDED.current_step,
       status = CASE
         WHEN user_onboarding_progress.tour_version = EXCLUDED.tour_version
           AND user_onboarding_progress.status = 'completed' THEN 'completed'
         ELSE EXCLUDED.status
       END,
       started_at = CASE
         WHEN user_onboarding_progress.tour_version = EXCLUDED.tour_version
           THEN user_onboarding_progress.started_at
         ELSE NOW()
       END,
       completed_at = CASE
         WHEN user_onboarding_progress.tour_version = EXCLUDED.tour_version
           AND user_onboarding_progress.completed_at IS NOT NULL
           THEN user_onboarding_progress.completed_at
         WHEN EXCLUDED.status = 'completed' THEN NOW()
         ELSE NULL
       END,
       updated_at = NOW()`,
    [userId, tourId, tourVersion, currentStep, status]
  )
}

export async function getOnboardingUserProgress(
  tourId: string,
  tourVersion: number
): Promise<OnboardingUserProgress[]> {
  const result = await getPgPool().query(
    `SELECT u.id AS "userId", u.full_name AS "fullName", u.email, r.name AS role,
            CASE
              WHEN p.user_id IS NULL THEN 'not_started'
              WHEN p.status = 'completed' THEN 'completed'
              ELSE 'in_progress'
            END AS status,
            COALESCE(p.current_step, 0) AS "currentStep",
            p.started_at::text AS "startedAt", p.completed_at::text AS "completedAt",
            p.updated_at::text AS "updatedAt"
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN user_onboarding_progress p
       ON p.user_id = u.id AND p.tour_id = $1 AND p.tour_version = $2
     WHERE u.is_active = TRUE AND r.name = ANY($3::text[])
     ORDER BY
       CASE WHEN p.status = 'completed' THEN 1 WHEN p.status = 'in_progress' THEN 2 ELSE 3 END,
       LOWER(u.full_name)`,
    [tourId, tourVersion, SUPPORTED_ROLES]
  )
  return result.rows.map((row) => ({
    userId: row.userId,
    fullName: row.fullName,
    email: row.email,
    role: row.role as UserRole,
    status: row.status as OnboardingStatus,
    currentStep: Number(row.currentStep),
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    updatedAt: row.updatedAt
  }))
}

export async function createAuthSession(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
  const db = getPgPool()
  await db.query('DELETE FROM auth_sessions WHERE expires_at <= NOW() OR revoked_at < NOW() - INTERVAL \'30 days\'')
  const result = await db.query(
    `INSERT INTO auth_sessions (token_hash, user_id, expires_at)
     SELECT $1, id, $3 FROM users WHERE id = $2 AND is_active = TRUE`,
    [tokenHash, userId, expiresAt]
  )
  if (result.rowCount !== 1) throw new Error('Account is unavailable.')
}

export async function getAuthSession(tokenHash: string): Promise<SessionUser | null> {
  const result = await getPgPool().query(
    `SELECT u.id, u.email, r.name AS role, u.full_name AS "fullName",
            u.avatar_initials AS "avatarInitials", u.created_at::text AS "createdAt",
            EXTRACT(EPOCH FROM s.expires_at) * 1000 AS "expiresAt"
     FROM auth_sessions s
     JOIN users u ON u.id = s.user_id
     JOIN roles r ON r.id = u.role_id
     WHERE s.token_hash = $1 AND s.revoked_at IS NULL
       AND s.expires_at > NOW() AND u.is_active = TRUE AND r.name = ANY($2::text[])
     LIMIT 1`,
    [tokenHash, SUPPORTED_ROLES]
  )
  if (!result.rows[0]) return null

  const activeSession = await getPgPool().query(
    'UPDATE auth_sessions SET last_seen_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()',
    [tokenHash]
  )
  if (activeSession.rowCount !== 1) return null
  const user = toUser(result.rows[0])
  return { ...user, expiresAt: Number(result.rows[0].expiresAt) }
}

export async function revokeAuthSession(tokenHash: string): Promise<void> {
  await getPgPool().query(
    'UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, NOW()) WHERE token_hash = $1',
    [tokenHash]
  )
}

export async function isLoginBlocked(email: string): Promise<boolean> {
  const result = await getPgPool().query(
    'SELECT locked_until > NOW() AS blocked FROM auth_login_attempts WHERE email = LOWER($1)',
    [email]
  )
  return result.rows[0]?.blocked === true
}

export async function recordLoginFailure(email: string): Promise<void> {
  const db = getPgPool()
  await db.query("DELETE FROM auth_login_attempts WHERE updated_at < NOW() - INTERVAL '1 day'")
  await db.query(
    `INSERT INTO auth_login_attempts (email, failed_attempts, window_started_at, locked_until, updated_at)
     VALUES (LOWER($1), 1, NOW(), NULL, NOW())
     ON CONFLICT (email) DO UPDATE SET
       failed_attempts = CASE
         WHEN auth_login_attempts.locked_until > NOW() THEN auth_login_attempts.failed_attempts
         WHEN auth_login_attempts.window_started_at < NOW() - INTERVAL '15 minutes' THEN 1
         ELSE auth_login_attempts.failed_attempts + 1
       END,
       window_started_at = CASE
         WHEN auth_login_attempts.window_started_at < NOW() - INTERVAL '15 minutes' THEN NOW()
         ELSE auth_login_attempts.window_started_at
       END,
       locked_until = CASE
         WHEN auth_login_attempts.locked_until > NOW() THEN auth_login_attempts.locked_until
         WHEN auth_login_attempts.window_started_at < NOW() - INTERVAL '15 minutes' THEN NULL
         WHEN auth_login_attempts.failed_attempts + 1 >= 8 THEN NOW() + INTERVAL '15 minutes'
         ELSE NULL
       END,
       updated_at = NOW()`,
    [email]
  )
}

export async function clearLoginFailures(email: string): Promise<void> {
  await getPgPool().query('DELETE FROM auth_login_attempts WHERE email = LOWER($1)', [email])
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    const updated = await client.query(
      `UPDATE users SET password_hash = $2, password_changed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND is_active = TRUE RETURNING full_name`,
      [userId, passwordHash]
    )
    if (updated.rowCount !== 1) throw new Error('Account is unavailable.')
    await client.query(
      `INSERT INTO audit_logs (id, actor_id, actor_name, action, target_type, target_id, details)
       VALUES ($1, $2, $3, 'PASSWORD_CHANGED', 'user', $2, '{}'::jsonb)`,
      [makeId(), userId, updated.rows[0].full_name]
    )
    await client.query('UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [userId])
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// -----------------------------------------------------------------------------
// Financial records and reporting
// -----------------------------------------------------------------------------

export async function getFinancialSummary(options?: { memberId?: string }): Promise<FinancialSummary> {
  const result = await getPgPool().query(
    `WITH scoped_records AS (
       SELECT member_id, type, status, amount
       FROM financial_records
       WHERE ($1::text IS NULL OR member_id = $1)
     ), totals AS (
       SELECT
         COALESCE(SUM(amount) FILTER (WHERE type = 'income' AND status = 'recorded'), 0)::text AS income,
         COALESCE(SUM(amount) FILTER (WHERE type = 'expense' AND status = 'recorded'), 0)::text AS expenses,
         COUNT(*) FILTER (WHERE status = 'needs_review')::int AS pending,
         COUNT(*)::int AS record_count,
         COUNT(DISTINCT member_id) FILTER (
           WHERE type = 'income' AND status IN ('recorded', 'needs_review')
             AND member_id IS NOT NULL
             AND EXISTS (SELECT 1 FROM members active_member
                         WHERE active_member.id = scoped_records.member_id AND active_member.status = 'active')
         )::int AS contributed
       FROM scoped_records
     )
     SELECT totals.*,
       CASE WHEN $1::text IS NULL
         THEN (SELECT COUNT(*)::int FROM members WHERE status = 'active')
         ELSE (SELECT COUNT(*)::int FROM members WHERE id = $1 AND status = 'active')
       END AS total_members
     FROM totals`,
    [options?.memberId || null]
  )

  const row = result.rows[0]
  const totalIncome = Number(row.income)
  const totalExpenses = Number(row.expenses)
  const totalMembers = Number(row.total_members)
  const membersContributed = Number(row.contributed)
  const currentBalance = totalIncome - totalExpenses

  return {
    totalIncome,
    totalExpenses,
    currentBalance,
    pendingCount: Number(row.pending),
    totalTransactions: Number(row.record_count),
    totalMembers,
    membersContributed,
    contributionPercentage: totalMembers > 0 ? Math.round((membersContributed / totalMembers) * 100) : 0,
    healthStatus: currentBalance < 0 ? 'Needs Attention' : Number(row.pending) > 0 ? 'Moderate' : 'Healthy'
  }
}

function financialRecordSelect(where = ''): string {
  return `SELECT r.id, r.type, r.category_id AS "categoryId", c.name AS "categoryName",
                 r.amount::text AS amount, r.currency, r.record_date::text AS "recordDate", r.description,
                 r.member_id AS "memberId", m.full_name AS "memberName",
                 r.recorded_by_id AS "recordedById", u.full_name AS "recordedByName",
                 r.status, r.rejection_reason AS "rejectionReason", r.receipt_filename AS "receiptFilename",
                 r.reference_number AS "referenceNumber", r.session_id AS "sessionId",
                 r.session_record_kind AS "sessionRecordKind", r.created_at::text AS "createdAt",
                 r.updated_at::text AS "updatedAt"
          FROM financial_records r
          JOIN financial_categories c ON c.id = r.category_id
          LEFT JOIN members m ON m.id = r.member_id
          JOIN users u ON u.id = r.recorded_by_id
          ${where}`
}

function mapFinancialRecord(row: any): FinancialRecord {
  return { ...row, amount: Number(row.amount) }
}

export async function getFinancialRecords(options?: {
  type?: 'income' | 'expense'
  memberId?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<FinancialRecord[]> {
  const conditions: string[] = []
  const values: unknown[] = []
  if (options?.type) {
    values.push(options.type)
    conditions.push(`r.type = $${values.length}`)
  }
  if (options?.memberId) {
    values.push(options.memberId)
    conditions.push(`r.member_id = $${values.length}`)
  }
  if (options?.status) {
    values.push(options.status)
    conditions.push(`r.status = $${values.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  let sql = `${financialRecordSelect(where)} ORDER BY r.record_date DESC, r.created_at DESC`
  if (options?.limit !== undefined) {
    values.push(boundedLimit(options.limit, 500, 5000))
    sql += ` LIMIT $${values.length}`
  }
  if (options?.offset && options.offset > 0) {
    values.push(Math.min(1000000, Math.floor(options.offset)))
    sql += ` OFFSET $${values.length}`
  }
  const result = await getPgPool().query(sql, values)
  return result.rows.map(mapFinancialRecord)
}

export async function getFinancialRecordById(id: string): Promise<FinancialRecord | null> {
  const result = await getPgPool().query(`${financialRecordSelect('WHERE r.id = $1')} LIMIT 1`, [id])
  return result.rows[0] ? mapFinancialRecord(result.rows[0]) : null
}

export async function createFinancialRecord(record: {
  type: 'income' | 'expense'
  categoryId: string
  amount: number
  recordDate: string
  description: string
  memberId?: string | null
  recordedById: string
  status?: 'recorded' | 'needs_review'
  receiptFilename?: string | null
  referenceNumber?: string
}): Promise<FinancialRecord> {
  if (!Number.isSafeInteger(record.amount) || record.amount <= 0) throw new Error('Amount must be a positive whole number.')
  const id = makeId()
  const status = record.status || 'recorded'
  const referenceNumber = record.referenceNumber || `REF-${new Date().getUTCFullYear()}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`
  const client = await getPgPool().connect()
  let row: any
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `INSERT INTO financial_records
         (id, type, category_id, amount, currency, record_date, description, member_id, recorded_by_id,
          status, receipt_filename, reference_number)
       VALUES ($1, $2, $3, $4, 'RWF', $5, $6, $7, $8, $9, $10, $11)
       RETURNING created_at::text AS "createdAt", updated_at::text AS "updatedAt"`,
      [
        id,
        record.type,
        record.categoryId,
        record.amount,
        record.recordDate,
        record.description.trim(),
        record.memberId || null,
        record.recordedById,
        status,
        record.receiptFilename || null,
        referenceNumber
      ]
    )
    row = result.rows[0]
    const audit = await client.query(
      `INSERT INTO audit_logs (id, actor_id, actor_name, action, target_type, target_id, details)
       SELECT $1, u.id, u.full_name, 'RECORD_CREATED', 'financial_record', $2, $3::jsonb
       FROM users u WHERE u.id = $4`,
      [makeId(), id, JSON.stringify({ amount: record.amount, type: record.type, categoryId: record.categoryId, status }), record.recordedById]
    )
    if (audit.rowCount !== 1) throw new Error('Could not write the record audit entry.')
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
  return {
    id,
    type: record.type,
    categoryId: record.categoryId,
    amount: record.amount,
    currency: 'RWF',
    recordDate: record.recordDate,
    description: record.description.trim(),
    memberId: record.memberId || undefined,
    recordedById: record.recordedById,
    status,
    receiptFilename: record.receiptFilename || undefined,
    referenceNumber,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

export async function updateRecordStatus(
  input:
    | string
    | {
        recordId: string
        status: 'recorded' | 'needs_review' | 'rejected' | 'voided'
        actorId?: string
        actorName?: string
        reason?: string
      },
  statusArg?: 'recorded' | 'needs_review' | 'rejected' | 'voided',
  rejectionReasonArg?: string
): Promise<FinancialRecord | null> {
  const recordId = typeof input === 'string' ? input : input.recordId
  const status = typeof input === 'string' ? statusArg : input.status
  const reason = typeof input === 'string' ? rejectionReasonArg : input.reason
  if (!status) throw new Error('A record status is required.')

  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    if (typeof input !== 'string' && input.actorId) {
      const ownership = await client.query(
        `SELECT r.session_record_kind AS kind, m.user_id AS "memberUserId"
         FROM financial_records r LEFT JOIN members m ON m.id = r.member_id
         WHERE r.id = $1 FOR UPDATE OF r`,
        [recordId]
      )
      if (ownership.rows[0]?.kind && ownership.rows[0].memberUserId === input.actorId) {
        await client.query('ROLLBACK')
        return null
      }
    }
    const updated = await client.query(
      `UPDATE financial_records
       SET status = $2, rejection_reason = $3, updated_at = NOW()
       WHERE id = $1
         AND ((status = 'needs_review' AND $2 IN ('recorded', 'rejected'))
           OR (status = 'recorded' AND $2 = 'voided'))`,
      [recordId, status, reason?.trim() || null]
    )
    if (updated.rowCount !== 1) {
      await client.query('ROLLBACK')
      return null
    }

    if (typeof input !== 'string' && input.actorId && input.actorName) {
      const action = status === 'recorded'
        ? 'RECORD_APPROVED'
        : status === 'rejected'
        ? 'RECORD_REJECTED'
        : status === 'voided'
        ? 'RECORD_VOIDED'
        : 'RECORD_STATUS_CHANGED'
      await client.query(
        `INSERT INTO audit_logs (id, actor_id, actor_name, action, target_type, target_id, details)
         VALUES ($1, $2, $3, $4, 'financial_record', $5, $6::jsonb)`,
        [makeId(), input.actorId, input.actorName, action, recordId, JSON.stringify({ status, reason: reason || null })]
      )
    }
    const sessionRecord = await client.query(
      `SELECT r.session_id AS "sessionId", r.session_record_kind AS kind, r.amount::text AS amount,
              m.user_id AS "userId", s.title AS "sessionTitle"
       FROM financial_records r
       LEFT JOIN members m ON m.id = r.member_id
       LEFT JOIN sessions s ON s.id = r.session_id
       WHERE r.id = $1`,
      [recordId]
    )
    const reviewed = sessionRecord.rows[0]
    if (reviewed?.sessionId && reviewed.userId && (status === 'recorded' || status === 'rejected')) {
      const approved = status === 'recorded'
      const eventName = reviewed.kind === 'CONTRIBUTION' ? 'Contribution' : 'Attendance penalty'
      await queueUserEvent(client, reviewed.userId, `session-record-review:${recordId}:${status}`,
        `${eventName} ${approved ? 'approved' : 'rejected'}`,
        `${reviewed.sessionTitle}: your ${eventName.toLowerCase()} of ${Number(reviewed.amount).toLocaleString('en-US')} RWF was ${approved ? 'approved and added to official financial totals' : 'rejected'}${reason?.trim() ? `: ${reason.trim()}` : '.'}`,
        approved ? 'success' : 'warning', `/sessions/${reviewed.sessionId}`)
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
  return getFinancialRecordById(recordId)
}

// -----------------------------------------------------------------------------
// Session engine: attendance, QR check-in, contribution collections and review
// -----------------------------------------------------------------------------

type SessionWriteClient = pg.PoolClient

export interface ChoirSessionInput {
  title: string
  description: string
  type: ChoirSessionType
  location: string | null
  startsAt: string
  endsAt: string
  deadlineAt: string
  visibility: ChoirSessionVisibility
  attendanceGraceMinutes: number
  lateFee: number
  absentFee: number
  targetAmount: number | null
  memberTargetAmount: number | null
  financialCategoryId: string | null
}

function sessionSelect(where = ''): string {
  return `SELECT s.id, s.title, s.description, s.type, s.location,
                 s.starts_at::text AS "startsAt", s.ends_at::text AS "endsAt",
                 s.deadline_at::text AS "deadlineAt", s.visibility, s.status,
                 s.attendance_grace_minutes AS "attendanceGraceMinutes",
                 s.late_fee::text AS "lateFee", s.absent_fee::text AS "absentFee",
                 s.target_amount::text AS "targetAmount", s.member_target_amount::text AS "memberTargetAmount",
                 s.financial_category_id AS "financialCategoryId", s.created_by_id AS "createdById",
                 creator.full_name AS "createdByName", s.created_at::text AS "createdAt",
                 s.updated_at::text AS "updatedAt", s.closed_at::text AS "closedAt"
          FROM sessions s
          JOIN users creator ON creator.id = s.created_by_id
          ${where}`
}

function mapChoirSession(row: any): ChoirSession {
  return {
    ...row,
    attendanceGraceMinutes: Number(row.attendanceGraceMinutes),
    lateFee: Number(row.lateFee),
    absentFee: Number(row.absentFee),
    targetAmount: row.targetAmount == null ? null : Number(row.targetAmount),
    memberTargetAmount: row.memberTargetAmount == null ? null : Number(row.memberTargetAmount)
  }
}

async function auditWithClient(
  client: SessionWriteClient,
  actor: { id: string; name: string },
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  await client.query(
    `INSERT INTO audit_logs (id, actor_id, actor_name, action, target_type, target_id, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [makeId(), actor.id, actor.name, action, targetType, targetId, JSON.stringify(details)]
  )
}

async function queueUserEvent(
  client: SessionWriteClient,
  userId: string,
  eventKey: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'alert',
  link: string
): Promise<void> {
  const recipient = await client.query(
    `SELECT email, full_name AS "fullName" FROM users WHERE id = $1 AND is_active = TRUE`,
    [userId]
  )
  if (!recipient.rowCount) return
  const user = recipient.rows[0]
  await client.query(
    `INSERT INTO notifications (id, user_id, title, message, type, link, event_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (event_key) WHERE event_key IS NOT NULL DO NOTHING`,
    [makeId(), userId, title, message, type, link, eventKey]
  )
  await client.query(
    `INSERT INTO email_outbox (id, event_key, recipient_email, recipient_name, subject, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (event_key) DO NOTHING`,
    [makeId(), eventKey, user.email, user.fullName, title, message]
  )
}

async function queueSessionRosterEvent(
  client: SessionWriteClient,
  sessionId: string,
  eventSuffix: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'alert'
): Promise<void> {
  const recipients = await client.query(
    `SELECT DISTINCT u.id AS "userId"
     FROM sessions s
     JOIN users u ON u.is_active = TRUE
     JOIN roles r ON r.id = u.role_id
     WHERE s.id = $1 AND (
       (s.visibility = 'PUBLIC' AND EXISTS (
         SELECT 1 FROM session_roster sr JOIN members m ON m.id = sr.member_id
         WHERE sr.session_id = s.id AND m.user_id = u.id
       )) OR (s.visibility = 'PRIVATE' AND r.name IN ('LEADER', 'ADMIN'))
     )`,
    [sessionId]
  )
  for (const { userId } of recipients.rows) {
    await queueUserEvent(client, userId, `${eventSuffix}:${sessionId}:${userId}`, title, message, type, `/sessions/${sessionId}`)
  }
}

async function queueLeaderEvent(
  client: SessionWriteClient,
  eventKey: string,
  title: string,
  message: string,
  link: string,
  omitUserId?: string
): Promise<void> {
  const leaders = await client.query(
    `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
     WHERE $1::text IS NOT NULL AND r.name IN ('LEADER', 'ADMIN')
       AND u.is_active = TRUE AND u.id <> COALESCE($2, '')`,
    [eventKey, omitUserId || null]
  )
  for (const { id } of leaders.rows) {
    await queueUserEvent(client, id, `${eventKey}:${id}`, title, message, 'info', link)
  }
}

export async function createChoirSession(
  input: ChoirSessionInput,
  actor: { id: string; name: string }
): Promise<ChoirSession> {
  const client = await getPgPool().connect()
  const id = makeId()
  try {
    await client.query('BEGIN')
    if (input.financialCategoryId) {
      const category = await client.query(
        `SELECT 1 FROM financial_categories WHERE id = $1 AND type = 'income' AND is_active = TRUE`,
        [input.financialCategoryId]
      )
      if (!category.rowCount) throw new Error('Choose an active income category for this session.')
    }
    const inserted = await client.query(
      `INSERT INTO sessions
         (id, title, description, type, location, starts_at, ends_at, deadline_at, visibility,
          attendance_grace_minutes, late_fee, absent_fee, target_amount, member_target_amount,
          financial_category_id, created_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [id, input.title, input.description, input.type, input.location, input.startsAt, input.endsAt,
        input.deadlineAt, input.visibility, input.attendanceGraceMinutes, input.lateFee, input.absentFee,
        input.targetAmount, input.memberTargetAmount, input.financialCategoryId, actor.id]
    )
    if (inserted.rowCount !== 1) throw new Error('Could not create the session.')
    await client.query(
      `INSERT INTO session_roster (session_id, member_id, attendance_status)
       SELECT $1, m.id, CASE WHEN $2 = 'ATTENDANCE' THEN 'NOT_CHECKED_IN' ELSE NULL END
       FROM members m
       WHERE m.status = 'active' AND ($3 = 'PUBLIC' OR EXISTS (
         SELECT 1 FROM users u JOIN roles r ON r.id = u.role_id
         WHERE u.id = m.user_id AND u.is_active = TRUE AND r.name IN ('LEADER', 'ADMIN')
       ))`,
      [id, input.type, input.visibility]
    )
    await auditWithClient(client, actor, 'SESSION_CREATED', 'session', id, {
      type: input.type, visibility: input.visibility, startsAt: input.startsAt,
      deadlineAt: input.deadlineAt, lateFee: input.lateFee, absentFee: input.absentFee,
      targetAmount: input.targetAmount, memberTargetAmount: input.memberTargetAmount
    })
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
  const result = await getPgPool().query(`${sessionSelect('WHERE s.id = $1')} LIMIT 1`, [id])
  if (!result.rows[0]) throw new Error('Session was created but could not be loaded.')
  return mapChoirSession(result.rows[0])
}

export async function updateChoirSession(
  sessionId: string,
  input: ChoirSessionInput,
  actor: { id: string; name: string }
): Promise<boolean> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    const current = await client.query(`SELECT title, status FROM sessions WHERE id = $1 FOR UPDATE`, [sessionId])
    if (!current.rowCount || !['DRAFT', 'SCHEDULED'].includes(current.rows[0].status)) {
      await client.query('ROLLBACK')
      return false
    }
    if (input.financialCategoryId) {
      const category = await client.query(
        `SELECT 1 FROM financial_categories WHERE id = $1 AND type = 'income' AND is_active = TRUE`,
        [input.financialCategoryId]
      )
      if (!category.rowCount) throw new Error('Choose an active income category for this session.')
    }
    await client.query(
      `UPDATE sessions SET title = $2, description = $3, type = $4, location = $5,
          starts_at = $6, ends_at = $7, deadline_at = $8, visibility = $9,
          attendance_grace_minutes = $10, late_fee = $11, absent_fee = $12,
          target_amount = $13, member_target_amount = $14, financial_category_id = $15,
          updated_at = NOW()
       WHERE id = $1`,
      [sessionId, input.title, input.description, input.type, input.location, input.startsAt,
        input.endsAt, input.deadlineAt, input.visibility, input.attendanceGraceMinutes,
        input.lateFee, input.absentFee, input.targetAmount, input.memberTargetAmount, input.financialCategoryId]
    )
    await client.query(
      `DELETE FROM session_roster sr
       WHERE sr.session_id = $1 AND NOT EXISTS (
         SELECT 1 FROM members m
         WHERE m.id = sr.member_id AND m.status = 'active'
           AND ($3 = 'PUBLIC' OR EXISTS (
             SELECT 1 FROM users u JOIN roles r ON r.id = u.role_id
             WHERE u.id = m.user_id AND u.is_active = TRUE AND r.name IN ('LEADER', 'ADMIN')
           ))
       )`,
      [sessionId, input.type, input.visibility]
    )
    await client.query(
      `INSERT INTO session_roster (session_id, member_id, attendance_status)
       SELECT $1, m.id, CASE WHEN $2 = 'ATTENDANCE' THEN 'NOT_CHECKED_IN' ELSE NULL END
       FROM members m
       WHERE m.status = 'active' AND ($3 = 'PUBLIC' OR EXISTS (
         SELECT 1 FROM users u JOIN roles r ON r.id = u.role_id
         WHERE u.id = m.user_id AND u.is_active = TRUE AND r.name IN ('LEADER', 'ADMIN')
       ))
       ON CONFLICT (session_id, member_id) DO NOTHING`,
      [sessionId, input.type, input.visibility]
    )
    await client.query(
      `UPDATE session_roster SET attendance_status = CASE WHEN $2 = 'ATTENDANCE' THEN 'NOT_CHECKED_IN' ELSE NULL END,
          checked_in_at = NULL WHERE session_id = $1`,
      [sessionId, input.type]
    )
    await auditWithClient(client, actor, 'SESSION_UPDATED', 'session', sessionId, {
      type: input.type, visibility: input.visibility, deadlineAt: input.deadlineAt
    })
    if (current.rows[0].status === 'SCHEDULED') {
      await queueSessionRosterEvent(client, sessionId, `session-updated-${makeId()}`, 'Session details updated',
        `${current.rows[0].title} has updated time, location, or participation details. Open Sessions to review the latest information.`, 'info')
    }
    await client.query('COMMIT')
    return true
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function publishChoirSession(
  sessionId: string,
  actor: { id: string; name: string }
): Promise<boolean> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    const locked = await client.query(`SELECT title, type, visibility, status FROM sessions WHERE id = $1 FOR UPDATE`, [sessionId])
    if (!locked.rowCount || !canTransitionSession(locked.rows[0].status, 'SCHEDULED')) {
      await client.query('ROLLBACK')
      return false
    }
    await client.query(
      `DELETE FROM session_roster sr
       WHERE sr.session_id = $1 AND NOT EXISTS (
         SELECT 1 FROM members m
         WHERE m.id = sr.member_id AND m.status = 'active'
           AND ($2 = 'PUBLIC' OR EXISTS (
             SELECT 1 FROM users u JOIN roles r ON r.id = u.role_id
             WHERE u.id = m.user_id AND u.is_active = TRUE AND r.name IN ('LEADER', 'ADMIN')
           ))
       )`,
      [sessionId, locked.rows[0].visibility]
    )
    await client.query(
      `INSERT INTO session_roster (session_id, member_id, attendance_status)
       SELECT $1, m.id, CASE WHEN $2 = 'ATTENDANCE' THEN 'NOT_CHECKED_IN' ELSE NULL END
       FROM members m
       WHERE m.status = 'active' AND ($3 = 'PUBLIC' OR EXISTS (
         SELECT 1 FROM users u JOIN roles r ON r.id = u.role_id
         WHERE u.id = m.user_id AND u.is_active = TRUE AND r.name IN ('LEADER', 'ADMIN')
       ))
       ON CONFLICT (session_id, member_id) DO NOTHING`,
      [sessionId, locked.rows[0].type, locked.rows[0].visibility]
    )
    await client.query(`UPDATE sessions SET status = 'SCHEDULED', updated_at = NOW() WHERE id = $1`, [sessionId])
    await auditWithClient(client, actor, 'SESSION_SCHEDULED', 'session', sessionId)
    await queueSessionRosterEvent(client, sessionId, 'session-scheduled', 'New choir session',
      `${locked.rows[0].title} has been scheduled. Open the Sessions page to view its time and details.`, 'info')
    await client.query('COMMIT')
    return true
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function openSessionWithToken(
  sessionId: string,
  actor: { id: string; name: string },
  rotate: boolean
): Promise<{ opened: boolean; qrToken: string | null }> {
  const client = await getPgPool().connect()
  const token = crypto.randomBytes(32).toString('base64url')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  try {
    await client.query('BEGIN')
    const locked = await client.query(`SELECT title, type, status FROM sessions WHERE id = $1 FOR UPDATE`, [sessionId])
    if (!locked.rowCount) {
      await client.query('ROLLBACK')
      return { opened: false, qrToken: null }
    }
    const row = locked.rows[0]
    if (rotate) {
      if (row.type !== 'ATTENDANCE' || row.status !== 'OPEN') {
        await client.query('ROLLBACK')
        return { opened: false, qrToken: null }
      }
      await client.query(`UPDATE sessions SET qr_token_hash = $2, updated_at = NOW() WHERE id = $1`, [sessionId, tokenHash])
      await auditWithClient(client, actor, 'SESSION_QR_ROTATED', 'session', sessionId)
      await client.query('COMMIT')
      return { opened: true, qrToken: token }
    }
    if (!canTransitionSession(row.status, 'OPEN')) {
      await client.query('ROLLBACK')
      return { opened: false, qrToken: null }
    }
    await client.query(
      `UPDATE sessions SET status = 'OPEN', qr_token_hash = $2, updated_at = NOW() WHERE id = $1`,
      [sessionId, row.type === 'ATTENDANCE' ? tokenHash : null]
    )
    await auditWithClient(client, actor, 'SESSION_OPENED', 'session', sessionId, { type: row.type })
    await queueSessionRosterEvent(client, sessionId, 'session-opened', 'Session is now open',
      `${row.title} is now open${row.type === 'ATTENDANCE' ? ' for attendance check-in' : ' for contributions'}.`, 'info')
    await client.query('COMMIT')
    return { opened: true, qrToken: row.type === 'ATTENDANCE' ? token : null }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function openChoirSession(sessionId: string, actor: { id: string; name: string }) {
  return openSessionWithToken(sessionId, actor, false)
}

export async function rotateAttendanceQr(sessionId: string, actor: { id: string; name: string }) {
  return openSessionWithToken(sessionId, actor, true)
}

export async function checkInToAttendanceSession(input: {
  sessionId: string
  token: string
  userId: string
  userName: string
  role: string
}): Promise<{ alreadyCheckedIn: boolean; status: AttendanceStatus; checkedInAt: string | null }> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    const sessionResult = await client.query(
      `SELECT id, title, type, status, visibility, starts_at AS "startsAt", deadline_at AS "deadlineAt",
              attendance_grace_minutes AS "graceMinutes", qr_token_hash AS "qrTokenHash", NOW() AS "now"
       FROM sessions WHERE id = $1 FOR UPDATE`,
      [input.sessionId]
    )
    if (!sessionResult.rowCount) throw new Error('This attendance session could not be found.')
    const session = sessionResult.rows[0]
    const presentedHash = crypto.createHash('sha256').update(input.token).digest()
    const storedHash = typeof session.qrTokenHash === 'string' && /^[a-f0-9]{64}$/.test(session.qrTokenHash)
      ? Buffer.from(session.qrTokenHash, 'hex')
      : Buffer.alloc(32)
    const now = new Date(session.now)
    const tokenValid = crypto.timingSafeEqual(presentedHash, storedHash)
    const memberResult = await client.query(
      `SELECT m.id, sr.attendance_status AS "attendanceStatus", sr.checked_in_at AS "checkedInAt"
       FROM members m
       JOIN session_roster sr ON sr.member_id = m.id AND sr.session_id = $1
       WHERE m.user_id = $2 AND m.status = 'active' FOR UPDATE OF sr`,
      [input.sessionId, input.userId]
    )
    const checkIn = validateAttendanceCheckIn({
      sessionType: session.type,
      sessionStatus: session.status,
      visibility: session.visibility,
      role: input.role,
      tokenValid,
      checkedInAt: now,
      startsAt: session.startsAt,
      deadlineAt: session.deadlineAt,
      graceMinutes: Number(session.graceMinutes),
      hasMember: memberResult.rowCount === 1
    })
    if (!checkIn.allowed) {
      const errors: Record<string, string> = {
        wrong_session_type: 'This QR code does not belong to an attendance session.',
        private_session: 'This private session is restricted to leaders and admins.',
        session_not_open: 'This attendance session is closed or not open yet.',
        invalid_qr: 'This QR code is no longer valid.',
        window_not_open: 'Check-in opens at the session start time.',
        deadline_passed: 'The check-in deadline has passed.',
        member_not_rostered: 'Your account is not on this session’s active member roster.'
      }
      throw new Error(errors[checkIn.reason || ''] || 'This check-in is not allowed.')
    }
    const member = memberResult.rows[0]
    if (hasCheckedIn(member.attendanceStatus)) {
      await client.query('COMMIT')
      return {
        alreadyCheckedIn: true,
        status: member.attendanceStatus as AttendanceStatus,
        checkedInAt: member.checkedInAt?.toISOString?.() || null
      }
    }
    const status = checkIn.status || attendanceStatusAt(now, session.startsAt, Number(session.graceMinutes))
    const saved = await client.query(
      `UPDATE session_roster SET attendance_status = $3, checked_in_at = $4
       WHERE session_id = $1 AND member_id = $2 AND attendance_status = 'NOT_CHECKED_IN'
       RETURNING checked_in_at::text AS "checkedInAt"`,
      [input.sessionId, member.id, status, now]
    )
    if (!saved.rowCount) throw new Error('Check-in could not be saved. Refresh and try again.')
    await auditWithClient(client, { id: input.userId, name: input.userName }, 'ATTENDANCE_CHECKED_IN', 'session', input.sessionId,
      { memberId: member.id, status, checkedInAt: now.toISOString() })
    await queueUserEvent(client, input.userId, `checkin:${input.sessionId}:${member.id}`,
      status === 'LATE' ? 'Late attendance recorded' : 'Attendance recorded',
      `${session.title}: your attendance is recorded as ${status.toLowerCase()}.`,
      status === 'LATE' ? 'warning' : 'success', `/sessions/${input.sessionId}`)
    await client.query('COMMIT')
    return { alreadyCheckedIn: false, status, checkedInAt: saved.rows[0].checkedInAt }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function completeChoirSession(
  sessionId: string,
  actor: { id: string; name: string }
): Promise<{ completed: boolean; alreadyCompleted: boolean; penaltiesCreated: number }> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    const sessionResult = await client.query(
      `SELECT id, title, type, status, starts_at AS "startsAt", late_fee AS "lateFee",
              absent_fee AS "absentFee", financial_category_id AS "financialCategoryId"
       FROM sessions WHERE id = $1 FOR UPDATE`,
      [sessionId]
    )
    if (!sessionResult.rowCount) throw new Error('This session could not be found.')
    const session = sessionResult.rows[0]
    if (session.status === 'COMPLETED') {
      await client.query('COMMIT')
      return { completed: true, alreadyCompleted: true, penaltiesCreated: 0 }
    }
    if (session.status !== 'OPEN' && session.status !== 'CLOSED') {
      throw new Error('Open the session before closing it.')
    }
    if (session.status === 'OPEN') {
      await client.query(
        `UPDATE sessions SET status = 'CLOSED', closed_at = NOW(), closed_by_id = $2, qr_token_hash = NULL, updated_at = NOW()
         WHERE id = $1`,
        [sessionId, actor.id]
      )
    }

    let penaltiesCreated = 0
    if (session.type === 'ATTENDANCE') {
      const rosterResult = await client.query(
        `SELECT member_id AS "memberId", attendance_status AS "attendanceStatus"
         FROM session_roster WHERE session_id = $1 ORDER BY member_id FOR UPDATE`,
        [sessionId]
      )
      const existingResult = await client.query(
        `SELECT member_id AS "memberId", session_record_kind AS kind
         FROM financial_records WHERE session_id = $1 AND session_record_kind IN ('LATE_PENALTY', 'ABSENT_PENALTY')`,
        [sessionId]
      )
      const existing = new Set(existingResult.rows.map((row) => `${row.memberId}:${row.kind}`))
      const plan = planAttendanceFinalization(
        rosterResult.rows,
        { lateFee: Number(session.lateFee), absentFee: Number(session.absentFee) },
        existing
      )
      if (plan.absentMemberIds.length) {
        await client.query(
          `UPDATE session_roster SET attendance_status = 'ABSENT'
           WHERE session_id = $1 AND member_id = ANY($2::text[]) AND attendance_status = 'NOT_CHECKED_IN'`,
          [sessionId, plan.absentMemberIds]
        )
      }
      for (const penalty of plan.penalties) {
        if (!session.financialCategoryId) throw new Error('Configure an active income category before generating attendance penalties.')
        const financialId = makeId()
        const description = `${penalty.kind === 'LATE_PENALTY' ? 'Late' : 'Absent'} attendance penalty — ${session.title}`
        const inserted = await client.query(
          `INSERT INTO financial_records
             (id, type, category_id, amount, currency, record_date, description, member_id, recorded_by_id,
              status, reference_number, session_id, session_record_kind)
           VALUES ($1, 'income', $2, $3, 'RWF',
             $4::date, $5, $6, $7,
             'needs_review', $8, $9, $10)
           ON CONFLICT DO NOTHING RETURNING id`,
          [financialId, session.financialCategoryId, penalty.amount, sessionDateIso(session.startsAt), description,
            penalty.memberId, actor.id, `SES-${sessionId.slice(0, 8)}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            sessionId, penalty.kind]
        )
        if (!inserted.rowCount) continue
        penaltiesCreated += 1
        await auditWithClient(client, actor, 'RECORD_CREATED', 'financial_record', financialId, {
          amount: penalty.amount, type: 'income', status: 'needs_review',
          sessionId, sessionRecordKind: penalty.kind, memberId: penalty.memberId
        })
        const recipient = await client.query(`SELECT user_id AS "userId" FROM members WHERE id = $1`, [penalty.memberId])
        if (recipient.rows[0]?.userId) {
          await queueUserEvent(client, recipient.rows[0].userId, `penalty:${financialId}`,
            'Attendance penalty pending review',
            `${session.title}: a ${penalty.kind === 'LATE_PENALTY' ? 'late' : 'absence'} penalty of ${penalty.amount.toLocaleString('en-US')} RWF is awaiting leader review. It has not been added to official totals.`,
            'warning', `/finances?status=needs_review&recordId=${financialId}`)
        }
      }
    }

    await auditWithClient(client, actor,
      session.type === 'ATTENDANCE' ? 'ATTENDANCE_SESSION_FINALIZED' : 'CONTRIBUTION_SESSION_CLOSED',
      'session', sessionId, { type: session.type, penaltiesCreated })
    await queueSessionRosterEvent(client, sessionId, 'session-completed', 'Session completed',
      `${session.title} has been closed.`, 'info')
    await client.query(
      `UPDATE sessions SET status = 'COMPLETED', completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [sessionId]
    )
    await client.query('COMMIT')
    return { completed: true, alreadyCompleted: false, penaltiesCreated }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function submitSessionContribution(input: {
  sessionId: string
  userId: string
  userName: string
  role: string
  amount: number
  requestKey: string
  note: string
}): Promise<{ id: string; status: 'needs_review'; alreadySubmitted: boolean }> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    const sessionResult = await client.query(
      `SELECT id, title, type, status, visibility, deadline_at AS "deadlineAt",
              financial_category_id AS "financialCategoryId", NOW() AS "now"
       FROM sessions WHERE id = $1 FOR UPDATE`,
      [input.sessionId]
    )
    if (!sessionResult.rowCount) throw new Error('This contribution session could not be found.')
    const session = sessionResult.rows[0]
    const memberResult = await client.query(
      `SELECT m.id FROM members m JOIN session_roster sr ON sr.member_id = m.id AND sr.session_id = $1
       WHERE m.user_id = $2 AND m.status = 'active' FOR UPDATE OF sr`,
      [input.sessionId, input.userId]
    )
    const submission = validateContributionSubmission({
      sessionType: session.type,
      sessionStatus: session.status,
      visibility: session.visibility,
      role: input.role,
      submittedAt: session.now,
      deadlineAt: session.deadlineAt,
      hasMember: memberResult.rowCount === 1
    })
    if (!submission.allowed) {
      const errors: Record<string, string> = {
        wrong_session_type: 'This session does not accept contributions.',
        private_session: 'This private session is restricted to leaders and admins.',
        session_not_open: 'This contribution session is not open.',
        deadline_passed: 'The contribution deadline has passed.',
        member_not_rostered: 'Your account is not on this session’s active member roster.'
      }
      throw new Error(errors[submission.reason || ''] || 'This contribution is not allowed.')
    }
    const memberId = memberResult.rows[0].id
    const previous = await client.query(
      `SELECT id, amount::text AS amount FROM financial_records
       WHERE session_id = $1 AND member_id = $2 AND session_submission_key = $3`,
      [input.sessionId, memberId, input.requestKey]
    )
    const idempotency = resolveIdempotentSubmission(previous.rows[0] || null, input.amount)
    if (idempotency.alreadySubmitted) {
      await client.query('COMMIT')
      return { id: idempotency.existingId as string, status: 'needs_review', alreadySubmitted: true }
    }
    if (!session.financialCategoryId) throw new Error('The contribution session has no income category configured.')
    const recordId = makeId()
    const description = input.note.trim() || `${session.title} contribution`
    const record = await client.query(
      `INSERT INTO financial_records
         (id, type, category_id, amount, currency, record_date, description, member_id, recorded_by_id,
          status, reference_number, session_id, session_record_kind, session_submission_key)
       VALUES ($1, 'income', $2, $3, 'RWF', CURRENT_DATE, $4, $5, $6,
          'needs_review', $7, $8, 'CONTRIBUTION', $9)
       RETURNING id`,
      [recordId, session.financialCategoryId, input.amount, description, memberId, input.userId,
        `SES-${input.sessionId.slice(0, 8)}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        input.sessionId, input.requestKey]
    )
    await auditWithClient(client, { id: input.userId, name: input.userName }, 'SESSION_CONTRIBUTION_SUBMITTED',
      'financial_record', recordId, { sessionId: input.sessionId, memberId, amount: input.amount, status: 'needs_review' })
    await queueLeaderEvent(client, `contribution-submitted:${recordId}`, 'Contribution awaiting review',
      `${input.userName} submitted a ${input.amount.toLocaleString('en-US')} RWF contribution to ${session.title}.`,
      `/sessions/${input.sessionId}`, input.userId)
    await client.query('COMMIT')
    return { id: record.rows[0].id, status: 'needs_review', alreadySubmitted: false }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getChoirSessions(role: string): Promise<ChoirSession[]> {
  const result = await getPgPool().query(
    `${sessionSelect(`WHERE (($1::text IN ('LEADER', 'ADMIN')) OR s.visibility = 'PUBLIC')
       AND (($1::text IN ('LEADER', 'ADMIN')) OR s.status <> 'DRAFT')`)}
     ORDER BY CASE s.status WHEN 'OPEN' THEN 0 WHEN 'SCHEDULED' THEN 1 ELSE 2 END, s.starts_at DESC`,
    [role]
  )
  return result.rows.map(mapChoirSession)
}

export async function getChoirSessionOverview(
  sessionId: string,
  role: string,
  memberId?: string | null
): Promise<SessionOverview | null> {
  const sessionResult = await getPgPool().query(
    `${sessionSelect(`WHERE s.id = $1
       AND (($2::text IN ('LEADER', 'ADMIN')) OR s.visibility = 'PUBLIC')
       AND (($2::text IN ('LEADER', 'ADMIN')) OR s.status <> 'DRAFT')`)} LIMIT 1`,
    [sessionId, role]
  )
  if (!sessionResult.rows[0]) return null
  const session = mapChoirSession(sessionResult.rows[0])
  const rosterResult = await getPgPool().query(
    `SELECT sr.member_id AS "memberId", m.full_name AS "memberName", m.voice_part AS "voicePart",
            sr.attendance_status AS "attendanceStatus", sr.checked_in_at::text AS "checkedInAt",
            COALESCE(SUM(r.amount) FILTER (WHERE r.session_record_kind = 'CONTRIBUTION' AND r.status = 'recorded'), 0)::text AS "approvedAmount",
            COALESCE(SUM(r.amount) FILTER (WHERE r.session_record_kind = 'CONTRIBUTION' AND r.status = 'needs_review'), 0)::text AS "pendingAmount",
            COUNT(*) FILTER (WHERE r.session_record_kind = 'CONTRIBUTION' AND r.status = 'rejected')::int AS "rejectedCount",
            COALESCE(SUM(r.amount) FILTER (WHERE r.session_record_kind IN ('LATE_PENALTY', 'ABSENT_PENALTY')), 0)::text AS "penaltyAmount",
            (ARRAY_AGG(r.status ORDER BY r.created_at DESC)
              FILTER (WHERE r.session_record_kind IN ('LATE_PENALTY', 'ABSENT_PENALTY')))[1] AS "penaltyStatus"
     FROM session_roster sr
     JOIN members m ON m.id = sr.member_id
     LEFT JOIN financial_records r ON r.session_id = sr.session_id AND r.member_id = sr.member_id
     WHERE sr.session_id = $1
     GROUP BY sr.member_id, m.full_name, m.voice_part, sr.attendance_status, sr.checked_in_at
     ORDER BY m.full_name ASC`,
    [sessionId]
  )
  const allRoster: SessionRosterEntry[] = rosterResult.rows.map((row) => {
    const approvedAmount = Number(row.approvedAmount)
    const pendingAmount = Number(row.pendingAmount)
    const rejectedCount = Number(row.rejectedCount)
    return {
      ...row,
      approvedAmount,
      pendingAmount,
      rejectedCount,
      penaltyAmount: Number(row.penaltyAmount),
      attendanceStatus: row.attendanceStatus as AttendanceStatus | null,
      penaltyStatus: row.penaltyStatus as FinancialRecordStatus | null,
      contributionStatus: session.type === 'CONTRIBUTION'
        ? classifyContributionMember({ approvedAmount, pendingAmount, rejectedCount, memberTargetAmount: session.memberTargetAmount })
        : null
    }
  })
  const attendance = session.type === 'ATTENDANCE'
    ? allRoster.reduce((counts, entry) => {
      if (entry.attendanceStatus === 'PRESENT') counts.presentCount += 1
      else if (entry.attendanceStatus === 'LATE') counts.lateCount += 1
      else if (entry.attendanceStatus === 'ABSENT') counts.absentCount += 1
      else counts.notCheckedInCount += 1
      return counts
    }, { presentCount: 0, lateCount: 0, absentCount: 0, notCheckedInCount: 0 })
    : { presentCount: 0, lateCount: 0, absentCount: 0, notCheckedInCount: 0 }
  const approvedAmount = allRoster.reduce((sum, entry) => sum + entry.approvedAmount, 0)
  const pendingAmount = allRoster.reduce((sum, entry) => sum + entry.pendingAmount, 0)
  const rejectedAmountResult = await getPgPool().query(
    `SELECT COALESCE(SUM(amount), 0)::text AS amount, COUNT(*)::int AS count
     FROM financial_records WHERE session_id = $1 AND session_record_kind = 'CONTRIBUTION' AND status = 'rejected'`,
    [sessionId]
  )
  const rejectedAmount = Number(rejectedAmountResult.rows[0].amount)
  let contributorCount = 0, partialCount = 0, completedCount = 0, pendingContributorCount = 0, notYetCount = 0
  for (const entry of allRoster) {
    if (entry.approvedAmount > 0) contributorCount += 1
    if (entry.contributionStatus === 'PARTIAL') partialCount += 1
    if (entry.contributionStatus === 'COMPLETED') completedCount += 1
    if (entry.pendingAmount > 0) pendingContributorCount += 1
    if (entry.contributionStatus === 'NOT_YET') notYetCount += 1
  }
  const canViewNames = role === 'LEADER' || role === 'ADMIN'
  const visibleRoster = canViewNames
    ? allRoster
    : role === 'MEMBER' && memberId
    ? allRoster.filter((entry) => entry.memberId === memberId)
    : []
  return {
    session,
    roster: visibleRoster,
    totalMembers: allRoster.length,
    ...attendance,
    approvedAmount,
    pendingAmount,
    rejectedAmount,
    contributorCount,
    partialCount,
    completedCount,
    pendingContributorCount,
    rejectedSubmissionCount: Number(rejectedAmountResult.rows[0].count),
    notYetCount
  }
}

export async function getMemberSessionHistory(memberId: string): Promise<MemberSessionHistoryItem[]> {
  const result = await getPgPool().query(
    `SELECT s.id AS "sessionId", s.title, s.type, s.starts_at::text AS "startsAt", s.status,
            s.member_target_amount::text AS "memberTargetAmount",
            sr.attendance_status AS "attendanceStatus",
            COALESCE(SUM(r.amount) FILTER (WHERE r.session_record_kind = 'CONTRIBUTION' AND r.status = 'recorded'), 0)::text AS "approvedAmount",
            COALESCE(SUM(r.amount) FILTER (WHERE r.session_record_kind = 'CONTRIBUTION' AND r.status = 'needs_review'), 0)::text AS "pendingAmount",
            COUNT(*) FILTER (WHERE r.session_record_kind = 'CONTRIBUTION' AND r.status = 'rejected')::int AS "rejectedCount",
            COALESCE(SUM(r.amount) FILTER (WHERE r.session_record_kind IN ('LATE_PENALTY', 'ABSENT_PENALTY')), 0)::text AS "penaltyAmount",
            (ARRAY_AGG(r.status ORDER BY r.created_at DESC)
              FILTER (WHERE r.session_record_kind IN ('LATE_PENALTY', 'ABSENT_PENALTY')))[1] AS "penaltyStatus"
     FROM session_roster sr
     JOIN sessions s ON s.id = sr.session_id
     LEFT JOIN financial_records r ON r.session_id = s.id AND r.member_id = sr.member_id
     WHERE sr.member_id = $1 AND s.visibility = 'PUBLIC' AND s.status <> 'DRAFT'
     GROUP BY s.id, s.title, s.type, s.starts_at, s.status, s.member_target_amount, sr.attendance_status
     ORDER BY s.starts_at DESC`,
    [memberId]
  )
  return result.rows.map((row) => {
    const approvedAmount = Number(row.approvedAmount)
    const pendingAmount = Number(row.pendingAmount)
    const rejectedCount = Number(row.rejectedCount)
    const memberTargetAmount = row.memberTargetAmount == null ? null : Number(row.memberTargetAmount)
    return {
      sessionId: row.sessionId,
      title: row.title,
      type: row.type,
      startsAt: row.startsAt,
      status: row.status,
      attendanceStatus: row.attendanceStatus,
      approvedAmount,
      pendingAmount,
      contributionStatus: row.type === 'CONTRIBUTION'
        ? classifyContributionMember({ approvedAmount, pendingAmount, rejectedCount, memberTargetAmount })
        : null,
      penaltyAmount: Number(row.penaltyAmount),
      penaltyStatus: row.penaltyStatus
    }
  })
}

export async function queueDueSessionNotifications(limit = 500): Promise<number> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    const due = await client.query(
      `SELECT s.id AS "sessionId", s.title, s.type, s.status, m.user_id AS "userId",
              CASE WHEN s.type = 'CONTRIBUTION' AND s.status = 'OPEN' THEN 'DEADLINE' ELSE 'REMINDER' END AS kind
       FROM sessions s
       JOIN session_roster sr ON sr.session_id = s.id
       JOIN members m ON m.id = sr.member_id AND m.user_id IS NOT NULL
       JOIN users u ON u.id = m.user_id AND u.is_active = TRUE
       WHERE ((s.status = 'SCHEDULED' AND s.starts_at > NOW() AND s.starts_at <= NOW() + INTERVAL '24 hours')
          OR (s.type = 'CONTRIBUTION' AND s.status = 'OPEN' AND s.deadline_at > NOW()
              AND s.deadline_at <= NOW() + INTERVAL '24 hours'))
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.event_key = (CASE WHEN s.type = 'CONTRIBUTION' AND s.status = 'OPEN'
                                   THEN 'contribution-deadline-24h:' ELSE 'session-reminder-24h:' END)
                           || s.id || ':' || m.user_id
       )
       ORDER BY s.starts_at ASC
       LIMIT $1`,
      [boundedLimit(limit, 500, 5000)]
    )
    for (const row of due.rows) {
      const deadline = row.kind === 'DEADLINE'
      await queueUserEvent(client, row.userId,
        `${deadline ? 'contribution-deadline-24h' : 'session-reminder-24h'}:${row.sessionId}:${row.userId}`,
        deadline ? 'Contribution deadline approaching' : 'Choir session reminder',
        deadline
          ? `${row.title} closes for contributions within 24 hours. Submit any contribution before the deadline.`
          : `${row.title} is scheduled within 24 hours. Open Sessions for the time and details.`,
        deadline ? 'warning' : 'info', `/sessions/${row.sessionId}`)
    }
    await client.query('COMMIT')
    return due.rowCount || 0
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// -----------------------------------------------------------------------------
// Categories and members
// -----------------------------------------------------------------------------

export async function getFinancialCategories(
  type?: FinancialRecordType,
  includeInactive = false
): Promise<FinancialCategory[]> {
  const result = await getPgPool().query(
    `SELECT id, name, type, description, is_active AS "isActive", created_at::text AS "createdAt"
     FROM financial_categories
     WHERE ($2::boolean OR is_active = TRUE) AND ($1::text IS NULL OR type = $1)
     ORDER BY name ASC`,
    [type || null, includeInactive]
  )
  return result.rows
}

export async function createFinancialCategory(
  input: { name: string; type: FinancialRecordType; description: string | null },
  actor: { id: string; name: string }
): Promise<FinancialCategory> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [input.type, input.name.toLowerCase()])
    const duplicate = await client.query(
      `SELECT 1 FROM financial_categories
       WHERE type = $1 AND LOWER(BTRIM(name)) = LOWER($2) AND is_active = TRUE LIMIT 1`,
      [input.type, input.name]
    )
    if (duplicate.rowCount) throw new Error('An active category with this name already exists for that type.')

    const id = makeId()
    const result = await client.query(
      `INSERT INTO financial_categories (id, name, type, description, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, name, type, description, is_active AS "isActive"`,
      [id, input.name, input.type, input.description]
    )
    await auditWithClient(client, actor, 'FINANCIAL_CATEGORY_CREATED', 'financial_category', id,
      { name: input.name, type: input.type })
    await client.query('COMMIT')
    return result.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function updateFinancialCategory(
  id: string,
  input: { name: string; type: FinancialRecordType; description: string | null },
  actor: { id: string; name: string }
): Promise<FinancialCategory> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    const currentResult = await client.query(
      `SELECT id, name, type, is_active AS "isActive" FROM financial_categories WHERE id = $1 FOR UPDATE`,
      [id]
    )
    const current = currentResult.rows[0]
    if (!current) throw new Error('Financial category not found.')
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [input.type, input.name.toLowerCase()])

    const duplicate = await client.query(
      `SELECT 1 FROM financial_categories
       WHERE id <> $1 AND type = $2 AND LOWER(BTRIM(name)) = LOWER($3) AND is_active = TRUE LIMIT 1`,
      [id, input.type, input.name]
    )
    if (duplicate.rowCount) throw new Error('An active category with this name already exists for that type.')

    if (current.type !== input.type) {
      const references = await client.query(
        `SELECT EXISTS (SELECT 1 FROM financial_records WHERE category_id = $1)
             OR EXISTS (SELECT 1 FROM sessions WHERE financial_category_id = $1) AS used`,
        [id]
      )
      if (references.rows[0].used) {
        throw new Error('A category used by financial records or sessions cannot change type.')
      }
    }

    const result = await client.query(
      `UPDATE financial_categories SET name = $2, type = $3, description = $4
       WHERE id = $1
       RETURNING id, name, type, description, is_active AS "isActive"`,
      [id, input.name, input.type, input.description]
    )
    await auditWithClient(client, actor, 'FINANCIAL_CATEGORY_UPDATED', 'financial_category', id,
      { previousName: current.name, previousType: current.type, name: input.name, type: input.type })
    await client.query('COMMIT')
    return result.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function deleteFinancialCategory(
  id: string,
  actor: { id: string; name: string }
): Promise<'deleted' | 'archived'> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    const currentResult = await client.query(
      `SELECT id, name, type FROM financial_categories WHERE id = $1 FOR UPDATE`,
      [id]
    )
    const current = currentResult.rows[0]
    if (!current) throw new Error('Financial category not found.')

    const references = await client.query(
      `SELECT EXISTS (SELECT 1 FROM financial_records WHERE category_id = $1)
           OR EXISTS (SELECT 1 FROM sessions WHERE financial_category_id = $1) AS used`,
      [id]
    )
    const used = Boolean(references.rows[0].used)
    if (used) {
      await client.query(`UPDATE financial_categories SET is_active = FALSE WHERE id = $1`, [id])
      await auditWithClient(client, actor, 'FINANCIAL_CATEGORY_ARCHIVED', 'financial_category', id,
        { name: current.name, type: current.type })
    } else {
      await client.query(`DELETE FROM financial_categories WHERE id = $1`, [id])
      await auditWithClient(client, actor, 'FINANCIAL_CATEGORY_DELETED', 'financial_category', id,
        { name: current.name, type: current.type })
    }
    await client.query('COMMIT')
    return used ? 'archived' : 'deleted'
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function restoreFinancialCategory(
  id: string,
  actor: { id: string; name: string }
): Promise<void> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    const currentResult = await client.query(
      `SELECT id, name, type, is_active AS "isActive" FROM financial_categories WHERE id = $1 FOR UPDATE`,
      [id]
    )
    const current = currentResult.rows[0]
    if (!current) throw new Error('Financial category not found.')
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [current.type, current.name.toLowerCase()])

    const duplicate = await client.query(
      `SELECT 1 FROM financial_categories
       WHERE id <> $1 AND type = $2 AND LOWER(BTRIM(name)) = LOWER($3) AND is_active = TRUE LIMIT 1`,
      [id, current.type, current.name]
    )
    if (duplicate.rowCount) throw new Error('Another active category already uses this name. Rename it before restoring.')

    await client.query(`UPDATE financial_categories SET is_active = TRUE WHERE id = $1`, [id])
    await auditWithClient(client, actor, 'FINANCIAL_CATEGORY_RESTORED', 'financial_category', id,
      { name: current.name, type: current.type })
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getMembers(): Promise<Member[]> {
  const result = await getPgPool().query(
    `SELECT id, user_id AS "userId", full_name AS "fullName", phone, voice_part AS "voicePart",
            status, joined_date::text AS "joinedDate", created_at::text AS "createdAt",
            updated_at::text AS "updatedAt"
     FROM members ORDER BY full_name ASC`
  )
  return result.rows
}

export async function getMemberById(id: string): Promise<Member | null> {
  const result = await getPgPool().query(
    `SELECT id, user_id AS "userId", full_name AS "fullName", phone, voice_part AS "voicePart",
            status, joined_date::text AS "joinedDate", created_at::text AS "createdAt",
            updated_at::text AS "updatedAt"
     FROM members WHERE id = $1`,
    [id]
  )
  return result.rows[0] || null
}

export async function getMemberByUserId(userId: string): Promise<Member | null> {
  const result = await getPgPool().query(
    `SELECT id, user_id AS "userId", full_name AS "fullName", phone, voice_part AS "voicePart",
            status, joined_date::text AS "joinedDate", created_at::text AS "createdAt",
            updated_at::text AS "updatedAt"
     FROM members WHERE user_id = $1`,
    [userId]
  )
  return result.rows[0] || null
}

export async function updateMemberProfile(
  userId: string,
  data: { fullName?: string; phone?: string }
): Promise<Member | null> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    if (data.fullName) {
      const initials = data.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
      const userUpdate = await client.query(
        `UPDATE users SET full_name = $2, avatar_initials = $3, updated_at = NOW() WHERE id = $1`,
        [userId, data.fullName.trim(), initials]
      )
      if (userUpdate.rowCount !== 1) throw new Error('User account was not found.')
    }
    await client.query(
      `UPDATE members
       SET full_name = COALESCE($2, full_name),
           phone = CASE WHEN $3::boolean THEN $4::text ELSE phone END,
           updated_at = NOW()
       WHERE user_id = $1`,
      [userId, data.fullName?.trim() || null, data.phone !== undefined, data.phone?.trim() || null]
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
  return getMemberByUserId(userId)
}

export async function getMembersByIds(ids: string[]): Promise<{ id: string; fullName: string; userId: string | null }[]> {
  if (ids.length === 0) return []
  const result = await getPgPool().query(
    `SELECT id, full_name AS "fullName", user_id AS "userId" FROM members WHERE id = ANY($1::text[])`,
    [ids]
  )
  return result.rows
}

export async function getPendingContributionMembers(): Promise<{ id: string; fullName: string; userId: string | null }[]> {
  const result = await getPgPool().query(`
    SELECT m.id, m.full_name AS "fullName", m.user_id AS "userId"
    FROM members m
    WHERE m.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM financial_records r
        WHERE r.member_id = m.id
          AND r.type = 'income'
          AND r.status IN ('recorded', 'needs_review')
          AND r.record_date >= DATE_TRUNC('month', CURRENT_DATE)::date
          AND r.record_date < (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::date
      )
    ORDER BY m.full_name ASC
  `)
  return result.rows
}

// -----------------------------------------------------------------------------
// Audit logs and notifications
// -----------------------------------------------------------------------------

export async function getAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
  const result = await getPgPool().query(
    `SELECT id, actor_id AS "actorId", actor_name AS "actorName", action,
            target_type AS "targetType", target_id AS "targetId", details,
            created_at::text AS "createdAt"
     FROM audit_logs ORDER BY created_at DESC LIMIT $1`,
    [boundedLimit(limit, 50)]
  )
  return result.rows
}

export async function createAuditLog(log: {
  actorId: string
  actorName: string
  action: string
  targetType: string
  targetId: string
  details?: Record<string, unknown>
}): Promise<AuditLogEntry> {
  const id = makeId()
  const result = await getPgPool().query(
    `INSERT INTO audit_logs (id, actor_id, actor_name, action, target_type, target_id, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
     RETURNING created_at::text AS "createdAt"`,
    [id, log.actorId, log.actorName, log.action, log.targetType, log.targetId, JSON.stringify(log.details || {})]
  )
  return {
    id,
    actorId: log.actorId,
    actorName: log.actorName,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    details: log.details,
    createdAt: result.rows[0].createdAt
  }
}

export async function getNotifications(userId: string, limit = 20): Promise<NotificationItem[]> {
  const result = await getPgPool().query(
    `SELECT id, user_id AS "userId", title, message, type, is_read AS "isRead", link,
            created_at::text AS "createdAt"
     FROM notifications WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [userId, boundedLimit(limit, 20)]
  )
  return result.rows
}

export async function createNotification(notif: {
  userId: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'alert'
  link?: string
}): Promise<NotificationItem> {
  const id = makeId()
  const result = await getPgPool().query(
    `INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
     VALUES ($1, $2, $3, $4, $5, FALSE, $6)
     RETURNING created_at::text AS "createdAt"`,
    [id, notif.userId, notif.title, notif.message, notif.type || 'info', notif.link || null]
  )
  return {
    id,
    userId: notif.userId,
    title: notif.title,
    message: notif.message,
    type: notif.type || 'info',
    isRead: false,
    link: notif.link,
    createdAt: result.rows[0].createdAt
  }
}

export async function markNotificationAsRead(id: string, userId: string): Promise<boolean> {
  const result = await getPgPool().query(
    'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
    [id, userId]
  )
  return (result.rowCount || 0) > 0
}

// -----------------------------------------------------------------------------
// Document metadata (contents are stored in the configured private object store)
// -----------------------------------------------------------------------------

const DOCUMENT_SELECT = `
  SELECT d.id, d.filename, d.original_name AS "originalName", d.mime_type AS "mimeType",
         d.size_bytes::text AS "sizeBytes", d.record_id AS "recordId", d.uploaded_by_id AS "uploadedById",
         u.full_name AS "uploadedByName", d.notes, d.created_at::text AS "createdAt",
         r.description AS "recordDescription", r.amount::text AS "recordAmount"
  FROM documents d
  JOIN users u ON u.id = d.uploaded_by_id
  LEFT JOIN financial_records r ON r.id = d.record_id
`

function mapDocument(row: any): FinancialDocument {
  return {
    ...row,
    sizeBytes: Number(row.sizeBytes),
    recordAmount: row.recordAmount == null ? undefined : Number(row.recordAmount)
  }
}

function documentAccessPredicate(parameterIndex: number): string {
  return `(d.uploaded_by_id = $${parameterIndex} OR r.member_id IN (
    SELECT id FROM members WHERE user_id = $${parameterIndex}
  ))`
}

export async function getDocuments(recordId?: string, memberUserId?: string): Promise<FinancialDocument[]> {
  const conditions: string[] = []
  const values: string[] = []
  if (recordId) {
    values.push(recordId)
    conditions.push(`d.record_id = $${values.length}`)
  }
  if (memberUserId) {
    values.push(memberUserId)
    conditions.push(documentAccessPredicate(values.length))
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await getPgPool().query(`${DOCUMENT_SELECT} ${where} ORDER BY d.created_at DESC`, values)
  return result.rows.map(mapDocument)
}

export async function getDocumentById(id: string, memberUserId?: string): Promise<FinancialDocument | null> {
  const conditions = ['d.id = $1']
  const values = [id]
  if (memberUserId) {
    values.push(memberUserId)
    conditions.push(documentAccessPredicate(values.length))
  }
  const result = await getPgPool().query(`${DOCUMENT_SELECT} WHERE ${conditions.join(' AND ')} LIMIT 1`, values)
  return result.rows[0] ? mapDocument(result.rows[0]) : null
}

export async function createDocument(doc: {
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  recordId?: string | null
  uploadedById: string
  uploadedByName: string
  notes?: string | null
}): Promise<FinancialDocument> {
  const id = makeId()
  const client = await getPgPool().connect()
  let row: any
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `INSERT INTO documents
         (id, filename, original_name, mime_type, size_bytes, record_id, uploaded_by_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, filename, original_name AS "originalName", mime_type AS "mimeType",
                 size_bytes::text AS "sizeBytes", record_id AS "recordId", uploaded_by_id AS "uploadedById",
                 notes, created_at::text AS "createdAt"`,
      [id, doc.filename, doc.originalName, doc.mimeType, doc.sizeBytes, doc.recordId || null, doc.uploadedById, doc.notes || null]
    )
    row = result.rows[0]
    if (doc.recordId) {
      await client.query(
        'UPDATE financial_records SET receipt_filename = $2, updated_at = NOW() WHERE id = $1',
        [doc.recordId, doc.filename]
      )
    }
    await client.query(
      `INSERT INTO audit_logs (id, actor_id, actor_name, action, target_type, target_id, details)
       VALUES ($1, $2, $3, 'DOCUMENT_UPLOADED', 'document', $4, $5::jsonb)`,
      [makeId(), doc.uploadedById, doc.uploadedByName, id, JSON.stringify({ filename: doc.originalName, sizeBytes: doc.sizeBytes, recordId: doc.recordId || null })]
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
  return {
    ...mapDocument({ ...row, uploadedByName: doc.uploadedByName }),
    recordAmount: undefined,
    recordDescription: undefined
  }
}
