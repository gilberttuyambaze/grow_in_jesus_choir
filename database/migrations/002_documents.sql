-- Migration: 002_documents.sql
-- Description: Adds secure documents and receipts storage table

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  record_id TEXT REFERENCES financial_records(id) ON DELETE SET NULL,
  uploaded_by_id TEXT NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_documents_record ON documents(record_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader ON documents(uploaded_by_id);

