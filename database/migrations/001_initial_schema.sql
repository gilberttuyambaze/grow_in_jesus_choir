-- PostgreSQL schema for the application data. User and financial rows are
-- provisioned from the production database; this migration contains no demo data.

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS financial_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_records (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id TEXT NOT NULL REFERENCES financial_categories(id),
  amount BIGINT NOT NULL CHECK (amount > 0),
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

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'alert')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_records_date ON financial_records(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_records_type ON financial_records(type);
CREATE INDEX IF NOT EXISTS idx_records_status ON financial_records(status);
CREATE INDEX IF NOT EXISTS idx_records_category ON financial_records(category_id);
CREATE INDEX IF NOT EXISTS idx_records_member ON financial_records(member_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

INSERT INTO roles (id, name, description) VALUES
  ('role_member', 'MEMBER', 'Choir member'),
  ('role_leader', 'LEADER', 'Choir leader'),
  ('role_admin', 'ADMIN', 'System administrator'),
  ('role_auditor', 'AUDITOR', 'Read-only financial auditor')
ON CONFLICT (name) DO NOTHING;
