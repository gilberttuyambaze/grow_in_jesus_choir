CREATE TABLE IF NOT EXISTS member_invitations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  voice_part TEXT NOT NULL CHECK (voice_part IN ('Soprano', 'Alto', 'Tenor', 'Bass')),
  invited_role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (invited_role = 'MEMBER'),
  message TEXT NOT NULL DEFAULT '' CHECK (length(message) <= 1000),
  token_hash CHAR(64) UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'SENT', 'ACCEPTED', 'EXPIRED', 'CANCELLED', 'FAILED')),
  invited_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  invited_by_name TEXT NOT NULL,
  delivery_generation INTEGER NOT NULL DEFAULT 1 CHECK (delivery_generation > 0),
  resend_count INTEGER NOT NULL DEFAULT 0 CHECK (resend_count >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  last_sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  accepted_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  accepted_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((status = 'ACCEPTED' AND accepted_at IS NOT NULL AND token_hash IS NULL)
      OR status <> 'ACCEPTED'),
  CHECK ((status = 'CANCELLED' AND cancelled_at IS NOT NULL AND token_hash IS NULL)
      OR status <> 'CANCELLED')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_member_invitations_open_email
  ON member_invitations (LOWER(email))
  WHERE status IN ('PENDING', 'SENT', 'FAILED');
CREATE INDEX IF NOT EXISTS idx_member_invitations_created
  ON member_invitations (created_at DESC);

CREATE TABLE IF NOT EXISTS member_communications (
  id TEXT PRIMARY KEY,
  sender_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  recipients_mode TEXT NOT NULL CHECK (recipients_mode IN ('SINGLE_MEMBER', 'SELECTED_MEMBERS', 'ALL_MEMBERS', 'MANUAL_EMAIL')),
  subject TEXT NOT NULL CHECK (length(trim(subject)) BETWEEN 1 AND 160),
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 10000),
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENDING', 'SENT', 'PARTIAL', 'FAILED')),
  in_app_notification BOOLEAN NOT NULL DEFAULT FALSE,
  important BOOLEAN NOT NULL DEFAULT FALSE,
  recipient_count INTEGER NOT NULL DEFAULT 0 CHECK (recipient_count >= 0),
  invalid_count INTEGER NOT NULL DEFAULT 0 CHECK (invalid_count >= 0),
  sent_count INTEGER NOT NULL DEFAULT 0 CHECK (sent_count >= 0),
  failed_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_member_communications_created
  ON member_communications (created_at DESC);

CREATE TABLE IF NOT EXISTS member_communication_recipients (
  id TEXT PRIMARY KEY,
  communication_id TEXT NOT NULL REFERENCES member_communications(id) ON DELETE CASCADE,
  member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENDING', 'SENT', 'FAILED')),
  sent_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (communication_id, recipient_email)
);
CREATE INDEX IF NOT EXISTS idx_communication_recipients_status
  ON member_communication_recipients (communication_id, status);

ALTER TABLE email_outbox ADD COLUMN IF NOT EXISTS html_content TEXT;
ALTER TABLE email_outbox ADD COLUMN IF NOT EXISTS invitation_id TEXT REFERENCES member_invitations(id) ON DELETE SET NULL;
ALTER TABLE email_outbox ADD COLUMN IF NOT EXISTS invitation_generation INTEGER;
ALTER TABLE email_outbox ADD COLUMN IF NOT EXISTS communication_recipient_id TEXT
  REFERENCES member_communication_recipients(id) ON DELETE SET NULL;

ALTER TABLE email_outbox DROP CONSTRAINT IF EXISTS email_outbox_status_check;
ALTER TABLE email_outbox ADD CONSTRAINT email_outbox_status_check
  CHECK (status IN ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED'));
ALTER TABLE email_outbox ADD CONSTRAINT email_outbox_delivery_target_check
  CHECK (NOT (invitation_id IS NOT NULL AND communication_recipient_id IS NOT NULL));

CREATE INDEX IF NOT EXISTS idx_email_outbox_invitation
  ON email_outbox (invitation_id, invitation_generation) WHERE invitation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_outbox_communication
  ON email_outbox (communication_recipient_id) WHERE communication_recipient_id IS NOT NULL;
