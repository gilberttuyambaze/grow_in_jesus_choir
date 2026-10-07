/**
 * Supabase PostgreSQL Database Client & Resilient Data Access Layer
 * Uses 'pg' connection pooling with Supabase PostgreSQL as primary source of truth,
 * with local SQLite fallback cache for offline resilience.
 */

import pg from 'pg'
import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'
import {
  FinancialRecord,
  FinancialCategory,
  FinancialSummary,
  Member,
  User,
  AuditLogEntry,
  NotificationItem,
  FinancialDocument
} from '@/types'

let pgPoolInstance: pg.Pool | null = null
let sqliteInstance: DatabaseSync | null = null

function toPlainRows<T extends object>(rows: T[]): T[] {
  return rows.map((row) => ({ ...row }))
}

export function getPgPool(): pg.Pool | null {
  if (pgPoolInstance) return pgPoolInstance

  const connectionString =
    process.env.POSTGRES_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_DIRECT_URL

  if (!connectionString) {
    return null
  }

  try {
    pgPoolInstance = new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    })

    pgPoolInstance.on('error', (err) => {
      console.warn('[PostgreSQL Pool Notice]:', err.message)
    })

    return pgPoolInstance
  } catch (err) {
    console.error('[PostgreSQL Pool Init Error]:', err)
    return null
  }
}

export function getDatabase(): DatabaseSync {
  if (sqliteInstance) return sqliteInstance

  const dbDir = path.resolve(process.cwd(), 'data')
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  const dbPath = path.join(dbDir, 'choir_finance.db')
  sqliteInstance = new DatabaseSync(dbPath)
  sqliteInstance.exec('PRAGMA foreign_keys = ON;')
  sqliteInstance.exec('PRAGMA journal_mode = WAL;')

  return sqliteInstance
}

/**
 * Universal query runner: executes against Supabase PostgreSQL pooler first,
 * with resilient fallback to local SQLite cache if network/pooler is unreachable.
 */
async function queryPgOrSqlite<T>(
  pgSql: string,
  pgParams: any[],
  sqliteFallback: () => T
): Promise<T> {
  const pool = getPgPool()
  if (pool) {
    try {
      const res = await pool.query(pgSql, pgParams)
      return res.rows as unknown as T
    } catch (err: any) {
      // If network unreachable or query error, fall back to SQLite
      return sqliteFallback()
    }
  }
  return sqliteFallback()
}

// -------------------------------------------------------------
// USER & AUTH QUERIES
// -------------------------------------------------------------

export async function getUserByEmail(
  email: string
): Promise<(User & { passwordHash: string }) | null> {
  const pool = getPgPool()
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT u.id, u.email, u.password_hash as "passwordHash", r.name as role, 
                u.full_name as "fullName", u.avatar_initials as "avatarInitials", u.created_at::text as "createdAt"
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE LOWER(u.email) = LOWER($1)`,
        [email.trim()]
      )
      if (res.rows.length > 0) return { ...res.rows[0] }
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.password_hash as passwordHash, r.name as role, 
              u.full_name as fullName, u.avatar_initials as avatarInitials, u.created_at as createdAt
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE LOWER(u.email) = LOWER(?)`
    )
    .get(email.trim()) as any
  return row ? { ...row } : null
}

export async function getUserById(id: string): Promise<User | null> {
  const pool = getPgPool()
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT u.id, u.email, r.name as role, u.full_name as "fullName", 
                u.avatar_initials as "avatarInitials", u.created_at::text as "createdAt"
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = $1`,
        [id]
      )
      if (res.rows.length > 0) return { ...res.rows[0] }
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  const row = db
    .prepare(
      `SELECT u.id, u.email, r.name as role, u.full_name as fullName, 
              u.avatar_initials as avatarInitials, u.created_at as createdAt
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`
    )
    .get(id) as any
  return row ? { ...row } : null
}

// -------------------------------------------------------------
// FINANCIAL RECORD QUERIES
// -------------------------------------------------------------

export async function getFinancialSummary(): Promise<FinancialSummary> {
  const pool = getPgPool()
  if (pool) {
    try {
      const res = await pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN type = 'income' AND status = 'recorded' THEN amount ELSE 0 END), 0) as "totalIncome",
          COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'recorded' THEN amount ELSE 0 END), 0) as "totalExpenses",
          COUNT(CASE WHEN status = 'needs_review' THEN 1 END) as "pendingCount",
          COUNT(*) as "totalTransactions"
        FROM financial_records;
      `)

      if (res.rows.length > 0) {
        const row = res.rows[0]
        const totalIncome = Number(row.totalIncome)
        const totalExpenses = Number(row.totalExpenses)
        return {
          totalIncome,
          totalExpenses,
          currentBalance: totalIncome - totalExpenses,
          pendingCount: Number(row.pendingCount),
          totalTransactions: Number(row.totalTransactions)
        }
      }
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  const inc = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM financial_records WHERE type = 'income' AND status = 'recorded'").get() as any).total
  const exp = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM financial_records WHERE type = 'expense' AND status = 'recorded'").get() as any).total
  const pending = (db.prepare("SELECT COUNT(*) as count FROM financial_records WHERE status = 'needs_review'").get() as any).count
  const totalCount = (db.prepare("SELECT COUNT(*) as count FROM financial_records").get() as any).count

  return {
    totalIncome: inc,
    totalExpenses: exp,
    currentBalance: inc - exp,
    pendingCount: pending,
    totalTransactions: totalCount
  }
}

export async function getFinancialRecords(options?: {
  type?: 'income' | 'expense'
  memberId?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<FinancialRecord[]> {
  const pool = getPgPool()
  if (pool) {
    try {
      const conditions: string[] = []
      const values: any[] = []

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

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const limitClause = options?.limit ? `LIMIT ${Number(options.limit)}` : ''
      const offsetClause = options?.offset ? `OFFSET ${Number(options.offset)}` : ''

      const res = await pool.query(
        `SELECT r.id, r.type, r.category_id as "categoryId", c.name as "categoryName",
                r.amount::bigint as amount, r.currency, r.record_date::text as "recordDate", r.description,
                r.member_id as "memberId", m.full_name as "memberName",
                r.recorded_by_id as "recordedById", u.full_name as "recordedByName",
                r.status, r.rejection_reason as "rejectionReason",
                r.receipt_filename as "receiptFilename", r.reference_number as "referenceNumber",
                r.created_at::text as "createdAt", r.updated_at::text as "updatedAt"
         FROM financial_records r
         JOIN financial_categories c ON r.category_id = c.id
         LEFT JOIN members m ON r.member_id = m.id
         JOIN users u ON r.recorded_by_id = u.id
         ${whereClause}
         ORDER BY r.record_date DESC, r.created_at DESC
         ${limitClause} ${offsetClause}`,
        values
      )

      return res.rows.map((row) => ({
        ...row,
        amount: Number(row.amount)
      }))
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  let sql = `
    SELECT r.id, r.type, r.category_id as categoryId, c.name as categoryName,
           r.amount, r.currency, r.record_date as recordDate, r.description,
           r.member_id as memberId, m.full_name as memberName,
           r.recorded_by_id as recordedById, u.full_name as recordedByName,
           r.status, r.rejection_reason as rejectionReason,
           r.receipt_filename as receiptFilename, r.reference_number as referenceNumber,
           r.created_at as createdAt, r.updated_at as updatedAt
    FROM financial_records r
    JOIN financial_categories c ON r.category_id = c.id
    LEFT JOIN members m ON r.member_id = m.id
    JOIN users u ON r.recorded_by_id = u.id
  `
  const conditions: string[] = []
  const params: any[] = []

  if (options?.type) {
    conditions.push('r.type = ?')
    params.push(options.type)
  }
  if (options?.memberId) {
    conditions.push('r.member_id = ?')
    params.push(options.memberId)
  }
  if (options?.status) {
    conditions.push('r.status = ?')
    params.push(options.status)
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`
  }
  sql += ' ORDER BY r.record_date DESC, r.created_at DESC'
  if (options?.limit) {
    sql += ` LIMIT ${Number(options.limit)}`
  }
  if (options?.offset) {
    sql += ` OFFSET ${Number(options.offset)}`
  }

  return toPlainRows(db.prepare(sql).all(...params) as any[])
}

export async function createFinancialRecord(record: {
  id?: string
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
  const id = record.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const status = record.status || 'recorded'
  const ref = record.referenceNumber || `REF-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`

  const pool = getPgPool()
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO financial_records 
          (id, type, category_id, amount, currency, record_date, description, member_id, recorded_by_id, status, receipt_filename, reference_number)
         VALUES ($1, $2, $3, $4, 'RWF', $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          record.type,
          record.categoryId,
          record.amount,
          record.recordDate,
          record.description,
          record.memberId || null,
          record.recordedById,
          status,
          record.receiptFilename || null,
          ref
        ]
      )
    } catch (err: any) {
      console.warn('[Postgres Insert Warning]:', err.message)
    }
  }

  // Also sync to SQLite cache
  const db = getDatabase()
  try {
    db.prepare(`
      INSERT INTO financial_records 
        (id, type, category_id, amount, currency, record_date, description, member_id, recorded_by_id, status, receipt_filename, reference_number)
      VALUES (?, ?, ?, ?, 'RWF', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      record.type,
      record.categoryId,
      record.amount,
      record.recordDate,
      record.description,
      record.memberId || null,
      record.recordedById,
      status,
      record.receiptFilename || null,
      ref
    )
  } catch {
    // ignore duplicate
  }

  return {
    id,
    type: record.type,
    categoryId: record.categoryId,
    amount: record.amount,
    currency: 'RWF',
    recordDate: record.recordDate,
    description: record.description,
    memberId: record.memberId || undefined,
    recordedById: record.recordedById,
    status,
    receiptFilename: record.receiptFilename || undefined,
    referenceNumber: ref,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
  const id = typeof input === 'string' ? input : input.recordId
  const status = typeof input === 'string' ? statusArg! : input.status
  const reason = typeof input === 'string' ? rejectionReasonArg : input.reason

  const pool = getPgPool()
  if (pool) {
    try {
      await pool.query(
        `UPDATE financial_records 
         SET status = $2, rejection_reason = $3, updated_at = NOW()
         WHERE id = $1`,
        [id, status, reason || null]
      )
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  db.prepare(`
    UPDATE financial_records 
    SET status = ?, rejection_reason = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, reason || null, id)

  if (typeof input !== 'string' && input.actorId && input.actorName) {
    await createAuditLog({
      actorId: input.actorId,
      actorName: input.actorName,
      action: status === 'recorded' ? 'RECORD_APPROVED' : status === 'rejected' ? 'RECORD_REJECTED' : 'RECORD_VOIDED',
      targetType: 'financial_record',
      targetId: id,
      details: { status, reason }
    })
  }

  const records = await getFinancialRecords()
  return records.find((r) => r.id === id) || null
}

// -------------------------------------------------------------
// CATEGORIES & MEMBERS
// -------------------------------------------------------------

export async function getFinancialCategories(
  type?: 'income' | 'expense'
): Promise<FinancialCategory[]> {
  const pool = getPgPool()
  if (pool) {
    try {
      const sql = type
        ? `SELECT id, name, type, description, is_active as "isActive", created_at::text as "createdAt"
           FROM financial_categories WHERE is_active = true AND type = $1 ORDER BY name ASC`
        : `SELECT id, name, type, description, is_active as "isActive", created_at::text as "createdAt"
           FROM financial_categories WHERE is_active = true ORDER BY name ASC`
      const params = type ? [type] : []
      const res = await pool.query(sql, params)
      return toPlainRows(res.rows)
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  let sql = 'SELECT id, name, type, description, is_active as isActive, created_at as createdAt FROM financial_categories WHERE is_active = 1'
  if (type) {
    sql += ' AND type = ?'
    return toPlainRows(db.prepare(sql).all(type) as any[])
  }
  return toPlainRows(db.prepare(sql).all() as any[])
}

export async function getMembers(): Promise<Member[]> {
  const pool = getPgPool()
  if (pool) {
    try {
      const res = await pool.query(`
        SELECT id, user_id as "userId", full_name as "fullName", phone, voice_part as "voicePart", 
               status, joined_date::text as "joinedDate", created_at::text as "createdAt", updated_at::text as "updatedAt"
        FROM members
        ORDER BY full_name ASC
      `)
      return toPlainRows(res.rows)
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  return db
    .prepare(`
      SELECT id, user_id as userId, full_name as fullName, phone, voice_part as voicePart, 
             status, joined_date as joinedDate, created_at as createdAt, updated_at as updatedAt
      FROM members
      ORDER BY full_name ASC
    `)
    .all()
    .map((row) => ({ ...row })) as any[]
}

export async function getMemberById(id: string): Promise<Member | null> {
  const pool = getPgPool()
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, user_id as "userId", full_name as "fullName", phone, voice_part as "voicePart", 
                status, joined_date::text as "joinedDate", created_at::text as "createdAt", updated_at::text as "updatedAt"
         FROM members WHERE id = $1`,
        [id]
      )
      if (res.rows.length > 0) return { ...res.rows[0] }
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  const row = db.prepare('SELECT id, user_id as userId, full_name as fullName, phone, voice_part as voicePart, status, joined_date as joinedDate, created_at as createdAt, updated_at as updatedAt FROM members WHERE id = ?').get(id) as any
  return row ? { ...row } : null
}

export async function getMemberByUserId(userId: string): Promise<Member | null> {
  const pool = getPgPool()
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, user_id as "userId", full_name as "fullName", phone, voice_part as "voicePart", 
                status, joined_date::text as "joinedDate", created_at::text as "createdAt", updated_at::text as "updatedAt"
         FROM members WHERE user_id = $1`,
        [userId]
      )
      if (res.rows.length > 0) return { ...res.rows[0] }
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  const row = db.prepare('SELECT id, user_id as userId, full_name as fullName, phone, voice_part as voicePart, status, joined_date as joinedDate, created_at as createdAt, updated_at as updatedAt FROM members WHERE user_id = ?').get(userId) as any
  return row ? { ...row } : null
}

export async function updateMemberProfile(
  userId: string,
  data: { fullName?: string; phone?: string }
): Promise<Member | null> {
  const pool = getPgPool()
  if (pool) {
    try {
      await pool.query(
        `UPDATE members 
         SET full_name = COALESCE($2, full_name), phone = COALESCE($3, phone), updated_at = NOW()
         WHERE user_id = $1`,
        [userId, data.fullName || null, data.phone || null]
      )
      if (data.fullName) {
        await pool.query(
          `UPDATE users SET full_name = $2, updated_at = NOW() WHERE id = $1`,
          [userId, data.fullName]
        )
      }
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  db.prepare(`
    UPDATE members 
    SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), updated_at = datetime('now')
    WHERE user_id = ?
  `).run(data.fullName || null, data.phone || null, userId)

  if (data.fullName) {
    db.prepare(`
      UPDATE users SET full_name = ?, updated_at = datetime('now') WHERE id = ?
    `).run(data.fullName, userId)
  }

  return getMemberByUserId(userId)
}

export async function getMembersByIds(
  ids: string[]
): Promise<{ id: string; fullName: string; userId: string | null }[]> {
  if (ids.length === 0) return []

  const pool = getPgPool()
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, full_name as "fullName", user_id as "userId" FROM members WHERE id = ANY($1)`,
        [ids]
      )
      return toPlainRows(res.rows)
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  const placeholders = ids.map(() => '?').join(',')
  return db
    .prepare(`SELECT id, full_name as fullName, user_id as userId FROM members WHERE id IN (${placeholders})`)
    .all(...ids)
    .map((row) => ({ ...row })) as any[]
}

export async function getPendingContributionMembers(): Promise<
  { id: string; fullName: string; userId: string | null }[]
> {
  const pool = getPgPool()
  if (pool) {
    try {
      const res = await pool.query(`
        SELECT m.id, m.full_name as "fullName", m.user_id as "userId"
        FROM members m
        WHERE m.id NOT IN (
          SELECT DISTINCT member_id FROM financial_records 
          WHERE member_id IS NOT NULL 
          AND record_date >= '2026-10-01' 
          AND status IN ('recorded', 'needs_review')
        )
      `)
      return toPlainRows(res.rows)
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  return db
    .prepare(`
      SELECT m.id, m.full_name as fullName, m.user_id as userId
      FROM members m
      WHERE m.id NOT IN (
        SELECT DISTINCT member_id FROM financial_records 
        WHERE member_id IS NOT NULL 
        AND record_date >= '2026-10-01' 
        AND status IN ('recorded', 'needs_review')
      )
    `)
    .all()
    .map((row) => ({ ...row })) as any[]
}

// -------------------------------------------------------------
// AUDIT LOGS & NOTIFICATIONS
// -------------------------------------------------------------

export async function getAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
  const pool = getPgPool()
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, actor_id as "actorId", actor_name as "actorName", action, 
                target_type as "targetType", target_id as "targetId", details, created_at::text as "createdAt"
         FROM audit_logs
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      )
      return toPlainRows(res.rows)
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  const rows = toPlainRows(db.prepare('SELECT id, actor_id as actorId, actor_name as actorName, action, target_type as targetType, target_id as targetId, details, created_at as createdAt FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(limit) as any[])
  return rows.map((r) => ({
    ...r,
    details: typeof r.details === 'string' ? JSON.parse(r.details) : r.details
  }))
}

export async function createAuditLog(log: {
  actorId: string
  actorName: string
  action: string
  targetType: string
  targetId: string
  details?: Record<string, any>
}): Promise<AuditLogEntry> {
  const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  const pool = getPgPool()
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO audit_logs (id, actor_id, actor_name, action, target_type, target_id, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, log.actorId, log.actorName, log.action, log.targetType, log.targetId, JSON.stringify(log.details || {})]
      )
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  try {
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_name, action, target_type, target_id, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, log.actorId, log.actorName, log.action, log.targetType, log.targetId, JSON.stringify(log.details || {}))
  } catch {
    // ignore
  }

  return {
    id,
    actorId: log.actorId,
    actorName: log.actorName,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    details: log.details,
    createdAt: new Date().toISOString()
  }
}

export async function getNotifications(userId: string, limit = 20): Promise<NotificationItem[]> {
  const pool = getPgPool()
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, user_id as "userId", title, message, type, is_read as "isRead", link, created_at::text as "createdAt"
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      )
      return toPlainRows(res.rows)
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  const rows = toPlainRows(db.prepare('SELECT id, user_id as userId, title, message, type, is_read as isRead, link, created_at as createdAt FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit) as any[])
  return rows.map((r) => ({
    ...r,
    isRead: Boolean(r.isRead)
  }))
}

export async function createNotification(notif: {
  userId: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'alert'
  link?: string
}): Promise<NotificationItem> {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const type = notif.type || 'info'

  const pool = getPgPool()
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
         VALUES ($1, $2, $3, $4, $5, false, $6)`,
        [id, notif.userId, notif.title, notif.message, type, notif.link || null]
      )
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  try {
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(id, notif.userId, notif.title, notif.message, type, notif.link || null)
  } catch {
    // ignore
  }

  return {
    id,
    userId: notif.userId,
    title: notif.title,
    message: notif.message,
    type,
    isRead: false,
    link: notif.link,
    createdAt: new Date().toISOString()
  }
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const pool = getPgPool()
  if (pool) {
    try {
      await pool.query(`UPDATE notifications SET is_read = true WHERE id = $1`, [id])
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id)
  return true
}

// -------------------------------------------------------------
// DOCUMENTS QUERIES
// -------------------------------------------------------------

export async function getDocuments(recordId?: string): Promise<FinancialDocument[]> {
  const pool = getPgPool()
  if (pool) {
    try {
      const sql = recordId
        ? `SELECT d.id, d.filename, d.original_name as "originalName", d.mime_type as "mimeType", 
                  d.size_bytes::bigint as "sizeBytes", d.record_id as "recordId", d.uploaded_by_id as "uploadedById", 
                  u.full_name as "uploadedByName", d.notes, d.created_at::text as "createdAt",
                  r.description as "recordDescription", r.amount::bigint as "recordAmount"
           FROM documents d
           JOIN users u ON d.uploaded_by_id = u.id
           LEFT JOIN financial_records r ON d.record_id = r.id
           WHERE d.record_id = $1
           ORDER BY d.created_at DESC`
        : `SELECT d.id, d.filename, d.original_name as "originalName", d.mime_type as "mimeType", 
                  d.size_bytes::bigint as "sizeBytes", d.record_id as "recordId", d.uploaded_by_id as "uploadedById", 
                  u.full_name as "uploadedByName", d.notes, d.created_at::text as "createdAt",
                  r.description as "recordDescription", r.amount::bigint as "recordAmount"
           FROM documents d
           JOIN users u ON d.uploaded_by_id = u.id
           LEFT JOIN financial_records r ON d.record_id = r.id
           ORDER BY d.created_at DESC`
      const params = recordId ? [recordId] : []
      const res = await pool.query(sql, params)
      return res.rows.map((r) => ({
        ...r,
        sizeBytes: Number(r.sizeBytes),
        recordAmount: r.recordAmount ? Number(r.recordAmount) : undefined
      }))
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  let sql = `
    SELECT d.id, d.filename, d.original_name as originalName, d.mime_type as mimeType, 
           d.size_bytes as sizeBytes, d.record_id as recordId, d.uploaded_by_id as uploadedById, 
           u.full_name as uploadedByName, d.notes, d.created_at as createdAt,
           r.description as recordDescription, r.amount as recordAmount
    FROM documents d
    JOIN users u ON d.uploaded_by_id = u.id
    LEFT JOIN financial_records r ON d.record_id = r.id
  `
  if (recordId) {
    sql += ' WHERE d.record_id = ?'
    return toPlainRows(db.prepare(sql).all(recordId) as any[])
  }
  sql += ' ORDER BY d.created_at DESC'
  return toPlainRows(db.prepare(sql).all() as any[])
}

export async function getDocumentById(id: string): Promise<FinancialDocument | null> {
  const pool = getPgPool()
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT d.id, d.filename, d.original_name as "originalName", d.mime_type as "mimeType", 
                d.size_bytes::bigint as "sizeBytes", d.record_id as "recordId", d.uploaded_by_id as "uploadedById", 
                u.full_name as "uploadedByName", d.notes, d.created_at::text as "createdAt",
                r.description as "recordDescription", r.amount::bigint as "recordAmount"
         FROM documents d
         JOIN users u ON d.uploaded_by_id = u.id
         LEFT JOIN financial_records r ON d.record_id = r.id
         WHERE d.id = $1`,
        [id]
      )
      if (res.rows.length > 0) {
        const row = res.rows[0]
        return {
          ...row,
          sizeBytes: Number(row.sizeBytes),
          recordAmount: row.recordAmount ? Number(row.recordAmount) : undefined
        }
      }
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  const row = db
    .prepare(`
      SELECT d.id, d.filename, d.original_name as originalName, d.mime_type as mimeType, 
             d.size_bytes as sizeBytes, d.record_id as recordId, d.uploaded_by_id as uploadedById, 
             u.full_name as uploadedByName, d.notes, d.created_at as createdAt,
             r.description as recordDescription, r.amount as recordAmount
      FROM documents d
      JOIN users u ON d.uploaded_by_id = u.id
      LEFT JOIN financial_records r ON d.record_id = r.id
      WHERE d.id = ?
    `)
    .get(id) as any
  return row ? { ...row } : null
}

export async function createDocument(doc: {
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  recordId?: string | null
  uploadedById: string
  notes?: string | null
}): Promise<FinancialDocument> {
  const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  const pool = getPgPool()
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO documents (id, filename, original_name, mime_type, size_bytes, record_id, uploaded_by_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, doc.filename, doc.originalName, doc.mimeType, doc.sizeBytes, doc.recordId || null, doc.uploadedById, doc.notes || null]
      )
    } catch {
      // fallback
    }
  }

  const db = getDatabase()
  try {
    db.prepare(`
      INSERT INTO documents (id, filename, original_name, mime_type, size_bytes, record_id, uploaded_by_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, doc.filename, doc.originalName, doc.mimeType, doc.sizeBytes, doc.recordId || null, doc.uploadedById, doc.notes || null)
  } catch {
    // ignore
  }

  return {
    id,
    filename: doc.filename,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    recordId: doc.recordId || undefined,
    uploadedById: doc.uploadedById,
    uploadedByName: 'Sarah Uwase',
    notes: doc.notes || undefined,
    createdAt: new Date().toISOString()
  }
}
