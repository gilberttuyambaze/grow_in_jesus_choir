CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  record_id TEXT REFERENCES financial_records(id) ON DELETE SET NULL,
  uploaded_by_id TEXT NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_record ON documents(record_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader ON documents(uploaded_by_id);
