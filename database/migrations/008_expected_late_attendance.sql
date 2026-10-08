ALTER TABLE session_roster
  DROP CONSTRAINT IF EXISTS session_roster_attendance_status_check,
  DROP CONSTRAINT IF EXISTS session_roster_check;

ALTER TABLE session_roster
  ADD CONSTRAINT session_roster_attendance_status_check
    CHECK (attendance_status IS NULL OR attendance_status IN (
      'NOT_CHECKED_IN', 'EXPECTED_LATE', 'PRESENT', 'LATE', 'ABSENT'
    )),
  ADD CONSTRAINT session_roster_checkin_timestamp_check
    CHECK (
      (attendance_status IS NULL AND checked_in_at IS NULL)
      OR (attendance_status IN ('NOT_CHECKED_IN', 'EXPECTED_LATE', 'ABSENT') AND checked_in_at IS NULL)
      OR (attendance_status IN ('PRESENT', 'LATE') AND checked_in_at IS NOT NULL)
    );
