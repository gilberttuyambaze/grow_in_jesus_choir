CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 160),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 2000),
  type TEXT NOT NULL CHECK (type IN ('ATTENDANCE', 'CONTRIBUTION')),
  location TEXT CHECK (location IS NULL OR length(location) <= 200),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  deadline_at TIMESTAMPTZ NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'PRIVATE')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'COMPLETED')),
  attendance_grace_minutes INTEGER NOT NULL DEFAULT 0 CHECK (attendance_grace_minutes BETWEEN 0 AND 1440),
  late_fee BIGINT NOT NULL DEFAULT 500 CHECK (late_fee >= 0),
  absent_fee BIGINT NOT NULL DEFAULT 1000 CHECK (absent_fee >= 0),
  target_amount BIGINT CHECK (target_amount IS NULL OR target_amount > 0),
  member_target_amount BIGINT CHECK (member_target_amount IS NULL OR member_target_amount > 0),
  financial_category_id TEXT REFERENCES financial_categories(id) ON DELETE RESTRICT,
  qr_token_hash TEXT,
  created_by_id TEXT NOT NULL REFERENCES users(id),
  closed_by_id TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CHECK (ends_at > starts_at),
  CHECK (deadline_at >= starts_at),
  CHECK (
    (type = 'ATTENDANCE' AND target_amount IS NULL AND member_target_amount IS NULL)
    OR
    (type = 'CONTRIBUTION' AND target_amount IS NOT NULL AND financial_category_id IS NOT NULL
      AND late_fee = 0 AND absent_fee = 0 AND attendance_grace_minutes = 0)
  ),
  CHECK ((late_fee = 0 AND absent_fee = 0) OR financial_category_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS session_roster (
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  attendance_status TEXT CHECK (attendance_status IS NULL OR attendance_status IN ('NOT_CHECKED_IN', 'PRESENT', 'LATE', 'ABSENT')),
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, member_id),
  CHECK ((attendance_status IS NULL AND checked_in_at IS NULL) OR
         (attendance_status IN ('NOT_CHECKED_IN', 'ABSENT') AND checked_in_at IS NULL) OR
         (attendance_status IN ('PRESENT', 'LATE') AND checked_in_at IS NOT NULL))
);

ALTER TABLE financial_records
  ADD COLUMN IF NOT EXISTS session_id TEXT REFERENCES sessions(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS session_record_kind TEXT,
  ADD COLUMN IF NOT EXISTS session_submission_key TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'financial_records_session_kind_check') THEN
    ALTER TABLE financial_records ADD CONSTRAINT financial_records_session_kind_check
      CHECK (session_record_kind IS NULL OR session_record_kind IN ('CONTRIBUTION', 'LATE_PENALTY', 'ABSENT_PENALTY'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'financial_records_session_link_check') THEN
    ALTER TABLE financial_records ADD CONSTRAINT financial_records_session_link_check
      CHECK (
        (session_id IS NULL AND session_record_kind IS NULL AND session_submission_key IS NULL)
        OR
        (session_id IS NOT NULL AND session_record_kind IS NOT NULL AND type = 'income' AND member_id IS NOT NULL
          AND ((session_record_kind = 'CONTRIBUTION' AND session_submission_key IS NOT NULL)
            OR (session_record_kind IN ('LATE_PENALTY', 'ABSENT_PENALTY') AND session_submission_key IS NULL)))
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_session_penalty_once
  ON financial_records (session_id, member_id, session_record_kind)
  WHERE session_record_kind IN ('LATE_PENALTY', 'ABSENT_PENALTY');

CREATE UNIQUE INDEX IF NOT EXISTS idx_session_contribution_request_once
  ON financial_records (session_id, member_id, session_submission_key)
  WHERE session_record_kind = 'CONTRIBUTION';

CREATE INDEX IF NOT EXISTS idx_sessions_visibility_status_start
  ON sessions (visibility, status, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_roster_member
  ON session_roster (member_id, session_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_session
  ON financial_records (session_id, session_record_kind, status);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS event_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_event_once
  ON notifications (event_key) WHERE event_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS email_outbox (
  id TEXT PRIMARY KEY,
  event_key TEXT NOT NULL UNIQUE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENDING', 'SENT')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  claim_token TEXT,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_queued
  ON email_outbox (created_at ASC) WHERE status = 'QUEUED';
