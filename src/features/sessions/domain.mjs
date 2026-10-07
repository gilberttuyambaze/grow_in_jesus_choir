export function attendanceStatusAt(checkedInAt, startsAt, graceMinutes) {
  const checkedAt = new Date(checkedInAt).getTime()
  const start = new Date(startsAt).getTime()
  if (!Number.isFinite(checkedAt) || !Number.isFinite(start)) throw new Error('Invalid attendance timestamp.')
  const grace = Number(graceMinutes)
  if (!Number.isInteger(grace) || grace < 0 || grace > 1440) throw new Error('Invalid attendance grace period.')
  return checkedAt <= start + grace * 60_000 ? 'PRESENT' : 'LATE'
}

export function validateAttendanceCheckIn({
  sessionType,
  sessionStatus,
  visibility,
  role,
  tokenValid,
  checkedInAt,
  startsAt,
  deadlineAt,
  graceMinutes,
  hasMember
}) {
  if (sessionType !== 'ATTENDANCE') return { allowed: false, reason: 'wrong_session_type' }
  if (visibility === 'PRIVATE' && !['LEADER', 'ADMIN'].includes(role)) return { allowed: false, reason: 'private_session' }
  if (sessionStatus !== 'OPEN') return { allowed: false, reason: 'session_not_open' }
  if (!tokenValid) return { allowed: false, reason: 'invalid_qr' }
  if (new Date(checkedInAt).getTime() < new Date(startsAt).getTime()) return { allowed: false, reason: 'window_not_open' }
  if (new Date(checkedInAt).getTime() > new Date(deadlineAt).getTime()) return { allowed: false, reason: 'deadline_passed' }
  if (!hasMember) return { allowed: false, reason: 'member_not_rostered' }
  return {
    allowed: true,
    status: attendanceStatusAt(checkedInAt, startsAt, graceMinutes)
  }
}

export function validateContributionSubmission({
  sessionType,
  sessionStatus,
  visibility,
  role,
  submittedAt,
  deadlineAt,
  hasMember
}) {
  if (sessionType !== 'CONTRIBUTION') return { allowed: false, reason: 'wrong_session_type' }
  if (visibility === 'PRIVATE' && !['LEADER', 'ADMIN'].includes(role)) return { allowed: false, reason: 'private_session' }
  if (sessionStatus !== 'OPEN') return { allowed: false, reason: 'session_not_open' }
  if (new Date(submittedAt).getTime() > new Date(deadlineAt).getTime()) return { allowed: false, reason: 'deadline_passed' }
  if (!hasMember) return { allowed: false, reason: 'member_not_rostered' }
  return { allowed: true, status: 'needs_review' }
}

export function sessionTypeRules(type, config = {}) {
  if (type === 'ATTENDANCE') {
    return {
      attendanceGraceMinutes: Number(config.attendanceGraceMinutes ?? 0),
      lateFee: Number(config.lateFee ?? 500),
      absentFee: Number(config.absentFee ?? 1000),
      targetAmount: null,
      memberTargetAmount: null
    }
  }
  if (type === 'CONTRIBUTION') {
    return {
      attendanceGraceMinutes: 0,
      lateFee: 0,
      absentFee: 0,
      targetAmount: Number(config.targetAmount ?? 0),
      memberTargetAmount: Number(config.memberTargetAmount ?? 0) || null
    }
  }
  throw new Error('Unsupported session type.')
}

export function hasCheckedIn(attendanceStatus) {
  return attendanceStatus !== 'NOT_CHECKED_IN'
}

export function resolveIdempotentSubmission(existing, requestedAmount) {
  if (!existing) return { alreadySubmitted: false, existingId: null }
  if (Number(existing.amount) !== Number(requestedAmount)) throw new Error('This submission key was already used for a different amount.')
  return { alreadySubmitted: true, existingId: existing.id }
}

export function canViewSession(role, visibility) {
  if (!['MEMBER', 'LEADER', 'ADMIN', 'AUDITOR'].includes(role)) return false
  return visibility === 'PUBLIC' || role === 'LEADER' || role === 'ADMIN'
}

export function canTransitionSession(from, to) {
  return (
    (from === 'DRAFT' && to === 'SCHEDULED') ||
    (from === 'SCHEDULED' && to === 'OPEN') ||
    (from === 'OPEN' && to === 'CLOSED') ||
    (from === 'CLOSED' && to === 'COMPLETED')
  )
}

export function classifyContributionMember({ approvedAmount, pendingAmount, rejectedCount, memberTargetAmount }) {
  const approved = Math.max(0, Number(approvedAmount) || 0)
  const pending = Math.max(0, Number(pendingAmount) || 0)
  const rejected = Math.max(0, Number(rejectedCount) || 0)
  const target = Math.max(0, Number(memberTargetAmount) || 0)
  if (target > 0 && approved >= target) return 'COMPLETED'
  if (approved > 0 && target > 0) return 'PARTIAL'
  if (approved > 0) return 'CONTRIBUTED'
  if (pending > 0) return 'PENDING'
  if (rejected > 0) return 'REJECTED'
  return 'NOT_YET'
}

export function officialFinancialAmount(status, amount) {
  return status === 'recorded' ? Number(amount) || 0 : 0
}

export function planAttendanceFinalization(roster, fees, existingPenaltyKeys = new Set()) {
  const absentMemberIds = []
  const penalties = []
  for (const entry of roster) {
    let status = entry.attendanceStatus
    if (status === 'NOT_CHECKED_IN') {
      status = 'ABSENT'
      absentMemberIds.push(entry.memberId)
    }
    const kind = status === 'LATE' ? 'LATE_PENALTY' : status === 'ABSENT' ? 'ABSENT_PENALTY' : null
    const amount = kind === 'LATE_PENALTY' ? Number(fees.lateFee) : kind === 'ABSENT_PENALTY' ? Number(fees.absentFee) : 0
    if (kind && amount > 0 && !existingPenaltyKeys.has(`${entry.memberId}:${kind}`)) {
      penalties.push({ memberId: entry.memberId, kind, amount })
    }
  }
  return { absentMemberIds, penalties }
}
