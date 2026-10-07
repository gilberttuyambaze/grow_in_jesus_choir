CREATE TABLE IF NOT EXISTS user_onboarding_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tour_id TEXT NOT NULL,
  tour_version INTEGER NOT NULL CHECK (tour_version > 0),
  current_step INTEGER NOT NULL DEFAULT 0 CHECK (current_step >= 0),
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, tour_id),
  CHECK ((status = 'completed' AND completed_at IS NOT NULL) OR status = 'in_progress')
);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_progress_tour_status
  ON user_onboarding_progress (tour_id, tour_version, status, updated_at DESC);
