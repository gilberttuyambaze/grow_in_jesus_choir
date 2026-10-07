import 'server-only'

import crypto from 'node:crypto'
import pg from 'pg'
import {
  AuditLogEntry,
  FinancialCategory,
  FinancialDocument,
  FinancialRecord,
  FinancialSummary,
  Member,
  NotificationItem,
  User,
  UserRole
} from '@/types'

type AuthUser = User & { passwordHash: string }
type SessionUser = User & { expiresAt: number }

let pool: pg.Pool | null = null

export function getPgPool(): pg.Pool {
  if (pool) return pool

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

  pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: true },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  })
  pool.on('error', (error: any) => {
    console.error('[PostgreSQL pool error]', error?.code || error?.message || 'unknown')
  })

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
     WHERE LOWER(u.email) = LOWER($1) AND u.is_active = TRUE
     LIMIT 1`,
    [email.trim()]
  )
  return result.rows[0] ? { ...result.rows[0], role: result.rows[0].role as UserRole } : null
}

export async function getUserForPasswordChange(userId: string): Promise<AuthUser | null> {
  const result = await getPgPool().query(
    `SELECT u.id, u.email, u.password_hash AS "passwordHash", r.name AS role,
            u.full_name AS "fullName", u.avatar_initials AS "avatarInitials",
            u.created_at::text AS "createdAt"
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1 AND u.is_active = TRUE`,
    [userId]
  )
  return result.rows[0] ? { ...result.rows[0], role: result.rows[0].role as UserRole } : null
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await getPgPool().query(`${USER_SELECT} WHERE u.id = $1 AND u.is_active = TRUE`, [id])
  return result.rows[0] ? toUser(result.rows[0]) : null
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
       AND s.expires_at > NOW() AND u.is_active = TRUE
     LIMIT 1`,
    [tokenHash]
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
                 r.reference_number AS "referenceNumber", r.created_at::text AS "createdAt",
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
// Categories and members
// -----------------------------------------------------------------------------

export async function getFinancialCategories(type?: 'income' | 'expense'): Promise<FinancialCategory[]> {
  const result = await getPgPool().query(
    `SELECT id, name, type, description, is_active AS "isActive", created_at::text AS "createdAt"
     FROM financial_categories
     WHERE is_active = TRUE AND ($1::text IS NULL OR type = $1)
     ORDER BY name ASC`,
    [type || null]
  )
  return result.rows
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
      await client.query(
        `UPDATE users SET full_name = $2, avatar_initials = $3, updated_at = NOW() WHERE id = $1`,
        [userId, data.fullName.trim(), initials]
      )
    }
    await client.query(
      `UPDATE members
       SET full_name = COALESCE($2, full_name), phone = COALESCE($3, phone), updated_at = NOW()
       WHERE user_id = $1`,
      [userId, data.fullName?.trim() || null, data.phone?.trim() || null]
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
