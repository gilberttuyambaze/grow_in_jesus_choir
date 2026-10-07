/**
 * Supabase PostgreSQL & Storage Deployment Script
 * Deploys schema tables, seed data, and Supabase Storage bucket for Grow in Jesus Choir.
 */

import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'
import { createClient } from '@supabase/supabase-js'

// 1. Load environment variables from .env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim()
        let val = trimmed.slice(eqIdx + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    }
  }
}

loadEnv()

const {
  DATABASE_URL,
  POSTGRES_DATABASE_URL,
  POSTGRES_DIRECT_URL,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_STORAGE_BUCKET
} = process.env

console.log('=== GROW IN JESUS CHOIR SUPABASE DEPLOYMENT ===')
console.log(`Supabase URL: ${SUPABASE_URL || 'NOT SET'}`)
console.log(`Storage Bucket: ${SUPABASE_STORAGE_BUCKET || 'NOT SET'}`)

const connectionString = POSTGRES_DATABASE_URL || DATABASE_URL || POSTGRES_DIRECT_URL
if (!connectionString) {
  console.error('[FATAL] No PostgreSQL connection string found in environment variables.')
  process.exit(1)
}

// Mask password for safe logging
const maskedConn = connectionString.replace(/:([^:@]+)@/, ':****@')
console.log(`Connecting to PostgreSQL: ${maskedConn}`)

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 10000
})

async function deploySchema(client) {
  console.log('\n[1/3] Deploying PostgreSQL Schema Tables & Indexes...')

  const schemaSql = `
    -- 1. Roles
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 2. Users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role_id TEXT NOT NULL REFERENCES roles(id),
      full_name TEXT NOT NULL,
      avatar_initials TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 3. Members
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      voice_part TEXT NOT NULL CHECK (voice_part IN ('Soprano', 'Alto', 'Tenor', 'Bass')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 4. Financial Categories
    CREATE TABLE IF NOT EXISTS financial_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 5. Financial Records
    CREATE TABLE IF NOT EXISTS financial_records (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      category_id TEXT NOT NULL REFERENCES financial_categories(id),
      amount BIGINT NOT NULL CHECK (amount > 0), -- minor units (RWF)
      currency TEXT NOT NULL DEFAULT 'RWF',
      record_date DATE NOT NULL,
      description TEXT NOT NULL,
      member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
      recorded_by_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'recorded' CHECK (status IN ('recorded', 'needs_review', 'rejected', 'voided')),
      rejection_reason TEXT,
      receipt_filename TEXT,
      reference_number TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 6. Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      actor_name TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 7. Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'alert')),
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      link TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 8. Documents
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes BIGINT NOT NULL,
      record_id TEXT REFERENCES financial_records(id) ON DELETE SET NULL,
      uploaded_by_id TEXT NOT NULL REFERENCES users(id),
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_records_date ON financial_records(record_date DESC);
    CREATE INDEX IF NOT EXISTS idx_records_type ON financial_records(type);
    CREATE INDEX IF NOT EXISTS idx_records_status ON financial_records(status);
    CREATE INDEX IF NOT EXISTS idx_records_category ON financial_records(category_id);
    CREATE INDEX IF NOT EXISTS idx_records_member ON financial_records(member_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_documents_record ON documents(record_id);
    CREATE INDEX IF NOT EXISTS idx_documents_uploader ON documents(uploaded_by_id);
  `

  await client.query(schemaSql)
  console.log('✓ All 8 core tables and 9 indexes verified/created.')
}

async function deploySeeds(client) {
  console.log('\n[2/3] Deploying Foundation Seed Data...')

  // 1. Roles
  await client.query(`
    INSERT INTO roles (id, name, description) VALUES
      ('role_leader', 'LEADER', 'Choir leader with financial oversight and administrative access'),
      ('role_member', 'MEMBER', 'Choir member with access to personal contributions and records submission'),
      ('role_admin', 'ADMIN', 'System administrator role reserved for platform maintenance')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description;
  `)
  console.log('✓ Roles seeded (LEADER, MEMBER, ADMIN).')

  // 2. Users
  await client.query(`
    INSERT INTO users (id, email, password_hash, role_id, full_name, avatar_initials) VALUES
      ('user_sarah', 'sarah@growinjesus.rw', '$2a$12$eX9K37b5dGb3PqWfG6r7Uu5Fq0r8q0F7y5f0f3u7f8q0f7y5f0f3u', 'role_leader', 'Sarah Uwase', 'SU'),
      ('user_john', 'john@growinjesus.rw', '$2a$12$eX9K37b5dGb3PqWfG6r7Uu5Fq0r8q0F7y5f0f3u7f8q0f7y5f0f3u', 'role_member', 'John Doe', 'JD'),
      ('user_grace', 'grace@growinjesus.rw', '$2a$12$eX9K37b5dGb3PqWfG6r7Uu5Fq0r8q0F7y5f0f3u7f8q0f7y5f0f3u', 'role_member', 'Grace Mukamana', 'GM'),
      ('user_jean', 'jeanclaude@growinjesus.rw', '$2a$12$eX9K37b5dGb3PqWfG6r7Uu5Fq0r8q0F7y5f0f3u7f8q0f7y5f0f3u', 'role_member', 'Jean Claude', 'JC'),
      ('user_eric', 'eric@growinjesus.rw', '$2a$12$eX9K37b5dGb3PqWfG6r7Uu5Fq0r8q0F7y5f0f3u7f8q0f7y5f0f3u', 'role_member', 'Eric Nshimiyimana', 'EN')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role_id = EXCLUDED.role_id;
  `)
  console.log('✓ Core users seeded (Sarah Uwase, John Doe, Grace, Jean Claude, Eric).')

  // 3. Categories
  await client.query(`
    INSERT INTO financial_categories (id, name, type, description, is_active) VALUES
      ('cat_inc_contributions', 'Member Contributions', 'income', 'Monthly choir member tithes and contributions', true),
      ('cat_inc_donations', 'Donations', 'income', 'Voluntary contributions from patrons and church partners', true),
      ('cat_inc_events', 'Concerts & Events', 'income', 'Concert ticketing, guest appearances, and anniversary gifts', true),
      ('cat_inc_fundraising', 'Fundraising', 'income', 'Special targeted choir development campaigns', true),
      ('cat_inc_other', 'Other Income', 'income', 'Miscellaneous choir income', true),
      ('cat_exp_transport', 'Transport', 'expense', 'Bus rentals, rehearsal transit, and Sunday logistics', true),
      ('cat_exp_equipment', 'Equipment', 'expense', 'Microphones, cables, audio hardware, and stands', true),
      ('cat_exp_music', 'Music & Uniforms', 'expense', 'Sheet music, Robe tailoring, and choir attire', true),
      ('cat_exp_venue', 'Venue & Rehearsal', 'expense', 'Hall rentals, sound system upkeep, and refreshments', true),
      ('cat_exp_communication', 'Communication', 'expense', 'SMS reminders, internet, and platform costs', true),
      ('cat_exp_admin', 'Administration', 'expense', 'Office stationery, bank charges, and printing', true),
      ('cat_exp_other', 'Other Expense', 'expense', 'Uncategorized emergency expenses', true)
    ON CONFLICT (id) DO NOTHING;
  `)
  console.log('✓ 12 Financial Categories seeded.')

  // 4. 50 Choir Members
  const membersData = [
    ['mem_01', 'user_sarah', 'Sarah Uwase', '+250 788 111 001', 'Soprano', 'active', '2024-01-15'],
    ['mem_02', 'user_john', 'John Doe', '+250 788 111 002', 'Tenor', 'active', '2024-02-10'],
    ['mem_03', 'user_grace', 'Grace Mukamana', '+250 788 111 003', 'Alto', 'active', '2024-03-01'],
    ['mem_04', 'user_jean', 'Jean Claude', '+250 788 111 004', 'Bass', 'active', '2024-01-20'],
    ['mem_05', 'user_eric', 'Eric Nshimiyimana', '+250 788 111 005', 'Tenor', 'active', '2024-02-25'],
    ['mem_06', null, 'Aline Uwimana', '+250 788 111 006', 'Soprano', 'active', '2024-01-10'],
    ['mem_07', null, 'Patrick Habimana', '+250 788 111 007', 'Bass', 'active', '2024-01-12'],
    ['mem_08', null, 'Chantal Mutoni', '+250 788 111 008', 'Alto', 'active', '2024-01-15'],
    ['mem_09', null, 'David Mugisha', '+250 788 111 009', 'Tenor', 'active', '2024-01-18'],
    ['mem_10', null, 'Diane Ingabire', '+250 788 111 010', 'Soprano', 'active', '2024-01-22'],
    ['mem_11', null, 'Emmanuel Bizimana', '+250 788 111 011', 'Bass', 'active', '2024-02-01'],
    ['mem_12', null, 'Esperance Mukarwego', '+250 788 111 012', 'Alto', 'active', '2024-02-05'],
    ['mem_13', null, 'Fabrice Ndayisaba', '+250 788 111 013', 'Tenor', 'active', '2024-02-08'],
    ['mem_14', null, 'Gloria Umutoni', '+250 788 111 014', 'Soprano', 'active', '2024-02-12'],
    ['mem_15', null, 'Herve Manzi', '+250 788 111 015', 'Bass', 'active', '2024-02-15'],
    ['mem_16', null, 'Innocent Gasana', '+250 788 111 016', 'Tenor', 'active', '2024-02-20'],
    ['mem_17', null, 'Josiane Kanyange', '+250 788 111 017', 'Alto', 'active', '2024-02-22'],
    ['mem_18', null, 'Kevin Tuyishime', '+250 788 111 018', 'Bass', 'active', '2024-03-01'],
    ['mem_19', null, 'Liliane Uwamahoro', '+250 788 111 019', 'Soprano', 'active', '2024-03-05'],
    ['mem_20', null, 'Moses Hakizimana', '+250 788 111 020', 'Tenor', 'active', '2024-03-10'],
    ['mem_21', null, 'Nadine Umurerwa', '+250 788 111 021', 'Alto', 'active', '2024-03-15'],
    ['mem_22', null, 'Olivier Rwego', '+250 788 111 022', 'Bass', 'active', '2024-03-20'],
    ['mem_23', null, 'Pacifique Kayitesi', '+250 788 111 023', 'Soprano', 'active', '2024-04-01'],
    ['mem_24', null, 'Queen Isimbi', '+250 788 111 024', 'Alto', 'active', '2024-04-05'],
    ['mem_25', null, 'Richard Rukundo', '+250 788 111 025', 'Tenor', 'active', '2024-04-10'],
    ['mem_26', null, 'Sandrine Mutesi', '+250 788 111 026', 'Soprano', 'active', '2024-04-15'],
    ['mem_27', null, 'Theoneste Nshuti', '+250 788 111 027', 'Bass', 'active', '2024-04-20'],
    ['mem_28', null, 'Yvette Uwera', '+250 788 111 028', 'Alto', 'active', '2024-05-01'],
    ['mem_29', null, 'Zacharie Munyaneza', '+250 788 111 029', 'Tenor', 'active', '2024-05-05'],
    ['mem_30', null, 'Beata Mukeshimana', '+250 788 111 030', 'Soprano', 'active', '2024-05-10'],
    ['mem_31', null, 'Claude Nkurunziza', '+250 788 111 031', 'Bass', 'active', '2024-05-15'],
    ['mem_32', null, 'Denise Mukamusonera', '+250 788 111 032', 'Alto', 'active', '2024-05-20'],
    ['mem_33', null, 'Eliezer Habiyambere', '+250 788 111 033', 'Tenor', 'active', '2024-06-01'],
    ['mem_34', null, 'Fiona Umubyeyi', '+250 788 111 034', 'Soprano', 'active', '2024-06-05'],
    ['mem_35', null, 'Gilbert Niyonsaba', '+250 788 111 035', 'Bass', 'active', '2024-06-10'],
    ['mem_36', null, 'Hortense Nyirasafari', '+250 788 111 036', 'Alto', 'active', '2024-06-15'],
    ['mem_37', null, 'Ignace Twagirayezu', '+250 788 111 037', 'Tenor', 'active', '2024-06-20'],
    ['mem_38', null, 'Jeanne D\'Arc Kayirangwa', '+250 788 111 038', 'Soprano', 'active', '2024-07-01'],
    ['mem_39', null, 'Lambert Nkeramugaba', '+250 788 111 039', 'Bass', 'active', '2024-07-05'],
    ['mem_40', null, 'Marie Claire Mukandayisenga', '+250 788 111 040', 'Alto', 'active', '2024-07-10'],
    ['mem_41', null, 'Noel Sibomana', '+250 788 111 041', 'Tenor', 'active', '2024-07-15'],
    ['mem_42', null, 'Odette Uwanyirigira', '+250 788 111 042', 'Soprano', 'active', '2024-07-20'],
    ['mem_43', null, 'Pascal Nshimiyimana', '+250 788 111 043', 'Bass', 'active', '2024-08-01'],
    ['mem_44', null, 'Rosine Mutamuriza', '+250 788 111 044', 'Alto', 'active', '2024-08-05'],
    ['mem_45', null, 'Serge Mugabo', '+250 788 111 045', 'Tenor', 'active', '2024-08-10'],
    ['mem_46', null, 'Therese Mukankusi', '+250 788 111 046', 'Soprano', 'active', '2024-08-15'],
    ['mem_47', null, 'Valens Nsengiyumva', '+250 788 111 047', 'Bass', 'active', '2024-08-20'],
    ['mem_48', null, 'Winnie Uwera', '+250 788 111 048', 'Alto', 'active', '2024-09-01'],
    ['mem_49', null, 'Xavier Ndayambaje', '+250 788 111 049', 'Tenor', 'active', '2024-09-05'],
    ['mem_50', null, 'Yvette Mukeshimana', '+250 788 111 050', 'Soprano', 'active', '2024-09-10']
  ]

  for (const m of membersData) {
    await client.query(`
      INSERT INTO members (id, user_id, full_name, phone, voice_part, status, joined_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        voice_part = EXCLUDED.voice_part;
    `, m)
  }
  console.log(`✓ 50 Choir Members seeded across Soprano, Alto, Tenor, Bass.`)

  // 5. Financial Records
  // Generate 42 individual contributing member records matching October dues
  // mem_01: Sarah Uwase (50,000 RWF)
  // mem_02..mem_42 (41 members): 30,000 RWF each (41 * 30,000 = 1,230,000 RWF)
  // Total member contributions = 50,000 + 1,230,000 = 1,280,000 RWF
  const memberContribRecords = []
  for (let i = 0; i < 42; i++) {
    const m = membersData[i]
    const memId = m[0]
    const memName = m[2]
    const amount = i === 0 ? 50000 : 30000
    const day = String((i % 7) + 1).padStart(2, '0')
    const id = `rec_c${String(i + 1).padStart(2, '0')}`
    const ref = `REF-2026-C${String(i + 1).padStart(2, '0')}`
    memberContribRecords.push([
      id,
      'income',
      'cat_inc_contributions',
      amount,
      'RWF',
      `2026-10-${day}`,
      `October monthly contribution - ${memName}`,
      memId,
      'user_sarah',
      'recorded',
      ref
    ])
  }

  const otherRecordsData = [
    ['rec_02', 'income', 'cat_inc_donations', 250000, 'RWF', '2026-10-04', 'Choir anniversary donation from Elder Mukamana', 'mem_03', 'user_sarah', 'recorded', 'REF-2026-1002'],
    ['rec_03', 'income', 'cat_inc_events', 850000, 'RWF', '2026-09-28', 'Worship Night concert guest offerings', null, 'user_sarah', 'recorded', 'REF-2026-0901'],
    ['rec_04', 'income', 'cat_inc_fundraising', 480000, 'RWF', '2026-09-15', 'Annual uniform modernization fund', null, 'user_sarah', 'recorded', 'REF-2026-0902'],
    ['rec_05', 'expense', 'cat_exp_transport', 30000, 'RWF', '2026-10-06', 'Transport for Sunday service team rehearsal', 'mem_04', 'user_sarah', 'recorded', 'EXP-2026-1001'],
    ['rec_06', 'expense', 'cat_exp_equipment', 85000, 'RWF', '2026-10-02', 'New microphone cables and jack adaptors', 'mem_05', 'user_sarah', 'needs_review', 'EXP-2026-1002'],
    ['rec_07', 'expense', 'cat_exp_venue', 450000, 'RWF', '2026-09-25', 'Sound system maintenance & hall booking', null, 'user_sarah', 'recorded', 'EXP-2026-0901'],
    ['rec_08', 'expense', 'cat_exp_music', 280000, 'RWF', '2026-09-20', 'Choir robes cleaning & seamstress repairs', null, 'user_sarah', 'recorded', 'EXP-2026-0902'],
    ['rec_09', 'expense', 'cat_exp_communication', 120000, 'RWF', '2026-09-10', 'Bulk SMS reminders and platform hosting', null, 'user_sarah', 'needs_review', 'EXP-2026-0903'],
    ['rec_10', 'expense', 'cat_exp_admin', 50000, 'RWF', '2026-09-05', 'Sheet music folder binders and printing', null, 'user_sarah', 'needs_review', 'EXP-2026-0904'],
    ['rec_11', 'income', 'cat_inc_contributions', 50000, 'RWF', '2026-10-07', 'Late contribution submission for October', 'mem_02', 'user_john', 'needs_review', 'REF-2026-1003']
  ]

  // Clean up legacy lump-sum rec_01 if present
  await client.query(`DELETE FROM financial_records WHERE id = 'rec_01';`)

  const recordsData = [...memberContribRecords, ...otherRecordsData]

  for (const r of recordsData) {
    await client.query(`
      INSERT INTO financial_records (id, type, category_id, amount, currency, record_date, description, member_id, recorded_by_id, status, reference_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        amount = EXCLUDED.amount,
        record_date = EXCLUDED.record_date,
        description = EXCLUDED.description,
        member_id = EXCLUDED.member_id,
        status = EXCLUDED.status;
    `, r)
  }
  console.log(`✓ ${recordsData.length} Financial records seeded (42 individual member contributions + 10 special items).`)

  // 6. Audit logs
  await client.query(`
    INSERT INTO audit_logs (id, actor_id, actor_name, action, target_type, target_id, details) VALUES
      ('aud_01', 'user_sarah', 'Sarah Uwase', 'RECORD_CREATED', 'financial_record', 'rec_c01', '{"amount":50000,"type":"income","category":"Contributions"}'),
      ('aud_02', 'user_sarah', 'Sarah Uwase', 'RECORD_CREATED', 'financial_record', 'rec_05', '{"amount":30000,"type":"expense","category":"Transport"}'),
      ('aud_03', 'user_john', 'John Doe', 'RECORD_CREATED', 'financial_record', 'rec_11', '{"amount":50000,"type":"income","category":"Contributions"}')
    ON CONFLICT (id) DO NOTHING;
  `)
  console.log('✓ Audit logs seeded.')

  // 7. Notifications
  await client.query(`
    INSERT INTO notifications (id, user_id, title, message, type, is_read, link) VALUES
      ('notif_01', 'user_sarah', 'Pending Record for Review', 'John Doe submitted a 50,000 RWF contribution for October', 'warning', false, '/finances?recordId=rec_11'),
      ('notif_02', 'user_sarah', 'Budget Milestone', 'Choir current balance reached healthy 1,845,000 RWF threshold', 'success', false, '/reports'),
      ('notif_03', 'user_john', 'Contribution Status', 'Your September contribution was verified and recorded', 'success', true, '/finances?recordId=rec_c02')
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      message = EXCLUDED.message,
      type = EXCLUDED.type,
      link = EXCLUDED.link;
  `)
  console.log('✓ Notifications seeded.')

  // 8. Documents
  await client.query(`
    INSERT INTO documents (id, filename, original_name, mime_type, size_bytes, record_id, uploaded_by_id, notes) VALUES
      ('doc_01', 'receipt_20261006_transport.pdf', 'Sunday_Transport_Payment_Proof.pdf', 'application/pdf', 142850, 'rec_05', 'user_sarah', 'Receipt issued by Kigali Express bus hire for rehearsal'),
      ('doc_02', 'receipt_20261002_cables.jpg', 'SoundHouse_Audio_Cables_Invoice.jpg', 'image/jpeg', 285400, 'rec_06', 'user_eric', 'Tax invoice for 4x balanced XLR microphone cables'),
      ('doc_03', 'receipt_20260925_hall.pdf', 'City_Worship_Hall_Booking_Agreement.pdf', 'application/pdf', 450120, 'rec_07', 'user_sarah', 'Deposit receipt and rental contract for anniversary concert')
    ON CONFLICT (id) DO NOTHING;
  `)
  console.log('✓ Documents seeded.')
}

async function verifyCounts(client) {
  console.log('\n[Table Verification & Row Counts]:')
  const tables = ['roles', 'users', 'members', 'financial_categories', 'financial_records', 'audit_logs', 'notifications', 'documents']
  for (const t of tables) {
    const res = await client.query(`SELECT COUNT(*) as count FROM ${t}`)
    console.log(`  - ${t.padEnd(22)}: ${res.rows[0].count} rows`)
  }
}

async function deployStorage() {
  console.log('\n[3/3] Initializing Supabase Storage Bucket...')
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️ Supabase URL or Service Role Key missing, skipping storage setup.')
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const bucketName = SUPABASE_STORAGE_BUCKET || 'grow-in-jesus-choir'

  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) {
    console.error('Error listing storage buckets:', listError.message)
    return
  }

  const existing = buckets.find((b) => b.name === bucketName)
  if (!existing) {
    console.log(`Creating private bucket: "${bucketName}"...`)
    const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: 52428800 // 50MB
    })
    if (createError) {
      console.error('Error creating bucket:', createError.message)
    } else {
      console.log(`✓ Bucket "${bucketName}" created successfully.`)
    }
  } else {
    console.log(`✓ Bucket "${bucketName}" exists and is active.`)
  }

  // Upload placeholder seed documents if not present
  const seedFiles = [
    { name: 'receipt_20261006_transport.pdf', type: 'application/pdf', content: '%PDF-1.4 [Sunday Transport Proof Kigali Express]' },
    { name: 'receipt_20261002_cables.jpg', type: 'image/jpeg', content: 'JPEG_DUMMY_IMAGE_SOUNDHOUSE_AUDIO_CABLES' },
    { name: 'receipt_20260925_hall.pdf', type: 'application/pdf', content: '%PDF-1.4 [City Worship Hall Rental Agreement]' }
  ]

  for (const sf of seedFiles) {
    const { data, error } = await supabase.storage.from(bucketName).upload(sf.name, Buffer.from(sf.content), {
      contentType: sf.type,
      upsert: true
    })
    if (error) {
      console.log(`  - Note on ${sf.name}: ${error.message}`)
    } else {
      console.log(`  ✓ Synced seed receipt to Supabase Storage: ${sf.name}`)
    }
  }
}

async function main() {
  const client = await pool.connect()
  try {
    await deploySchema(client)
    await deploySeeds(client)
    await verifyCounts(client)
    await deployStorage()
    console.log('\n🎉 ALL SUPABASE POSTGRESQL TABLES AND STORAGE DEPLOYED SUCCESSFULLY!\n')
  } catch (err) {
    console.error('\n❌ Deployment failed with error:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
