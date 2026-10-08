ALTER TABLE member_invitations
  DROP CONSTRAINT IF EXISTS member_invitations_invited_role_check;

ALTER TABLE member_invitations
  ADD CONSTRAINT member_invitations_invited_role_check
  CHECK (invited_role IN ('MEMBER', 'LEADER', 'ADMIN'));
