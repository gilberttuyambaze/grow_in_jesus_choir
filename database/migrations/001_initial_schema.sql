-- Migration: 001_initial_schema.sql
-- Description: Core schema for Grow in Jesus Choir Financial Monitoring Platform
-- Tables: roles, users, members, financial_categories, financial_records, audit_logs, notifications

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES roles(id),
  full_name TEXT NOT NULL,
  avatar_initials TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  voice_part TEXT NOT NULL CHECK (voice_part IN ('Soprano', 'Alto', 'Tenor', 'Bass')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  joined_date TEXT NOT NULL DEFAULT (date('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS financial_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS financial_records (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id TEXT NOT NULL REFERENCES financial_categories(id),
  amount INTEGER NOT NULL CHECK (amount > 0), -- Amount in Rwandan Francs (integer minor units)
  currency TEXT NOT NULL DEFAULT 'RWF',
  record_date TEXT NOT NULL, -- Format: YYYY-MM-DD
  description TEXT NOT NULL,
  member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
  recorded_by_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'recorded' CHECK (status IN ('recorded', 'needs_review', 'rejected', 'voided')),
  rejection_reason TEXT,
  receipt_filename TEXT,
  reference_number TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL, -- e.g. RECORD_CREATED, RECORD_APPROVED, RECORD_REJECTED
  target_type TEXT NOT NULL, -- e.g. financial_record, member, settings
  target_id TEXT NOT NULL,
  details TEXT, -- JSON summary of changes
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'alert')),
  is_read INTEGER NOT NULL DEFAULT 0,
  link TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performant financial querying and auditing
CREATE INDEX IF NOT EXISTS idx_records_date ON financial_records(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_records_type ON financial_records(type);
CREATE INDEX IF NOT EXISTS idx_records_status ON financial_records(status);
CREATE INDEX IF NOT EXISTS idx_records_category ON financial_records(category_id);
CREATE INDEX IF NOT EXISTS idx_records_member ON financial_records(member_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

