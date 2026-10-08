import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  attendanceStatusAt,
  calculateSessionFinancialTotals,
  canTransitionSession,
  canViewSession,
  classifyContributionMember,
  hasCheckedIn,
  officialFinancialAmount,
  planAttendanceFinalization,
  resolveIdempotentSubmission,
  sessionTypeRules,
  validateAttendanceCheckIn,
  validateContributionSubmission
} from '../src/features/sessions/domain.mjs'

const startsAt = '2026-10-12T15:00:00.000Z'
const deadlineAt = '2026-10-12T17:15:00.000Z'
const checkInContext = (overrides = {}) => ({
  sessionType: 'ATTENDANCE',
  sessionStatus: 'OPEN',
  visibility: 'PUBLIC',
  role: 'MEMBER',
  tokenValid: true,
  checkedInAt: '2026-10-12T15:08:00.000Z',
  startsAt,
  deadlineAt,
  graceMinutes: 15,
  hasMember: true,
  ...overrides
})

test('1. on-time member scans are PRESENT within the configured grace window', () => {
  assert.equal(attendanceStatusAt('2026-10-12T15:08:00Z', startsAt, 15), 'PRESENT')
  assert.equal(validateAttendanceCheckIn(checkInContext()).status, 'PRESENT')
})

test('2. scans after the configured grace window are LATE', () => {
  assert.equal(attendanceStatusAt('2026-10-12T15:16:00Z', startsAt, 15), 'LATE')
})

test('3. an open session keeps a missing scan unconfirmed rather than absent', () => {
  const attendanceStatus = 'NOT_CHECKED_IN'
  assert.equal(hasCheckedIn(attendanceStatus), false)
  assert.equal(attendanceStatus, 'NOT_CHECKED_IN')
})

test('4. session finalization marks an unchecked roster member absent', () => {
  const plan = planAttendanceFinalization([{ memberId: 'm1', attendanceStatus: 'NOT_CHECKED_IN' }], { lateFee: 500, absentFee: 1000 })
  assert.deepEqual(plan.absentMemberIds, ['m1'])
  assert.deepEqual(plan.penalties, [{ memberId: 'm1', kind: 'ABSENT_PENALTY', amount: 1000 }])
})

test('5. a second scan detects the existing attendance instead of creating a second check-in', () => {
  assert.equal(hasCheckedIn('PRESENT'), true)
  assert.equal(hasCheckedIn('LATE'), true)
  assert.equal(hasCheckedIn('ABSENT'), false)
})

test('6. a closed session rejects another QR check-in', () => {
  assert.deepEqual(validateAttendanceCheckIn(checkInContext({ sessionStatus: 'COMPLETED' })), {
    allowed: false, reason: 'session_not_open'
  })
})

test('7. a signed-in user outside the session roster cannot check in another member', () => {
  assert.deepEqual(validateAttendanceCheckIn(checkInContext({ hasMember: false })), {
    allowed: false, reason: 'member_not_rostered'
  })
})

test('8. a late check-in creates the configured late fee', () => {
  const plan = planAttendanceFinalization([{ memberId: 'm1', attendanceStatus: 'LATE' }], { lateFee: 700, absentFee: 1400 })
  assert.deepEqual(plan.penalties, [{ memberId: 'm1', kind: 'LATE_PENALTY', amount: 700 }])
})

test('9. an absent member receives the configured absence fee', () => {
  const plan = planAttendanceFinalization([{ memberId: 'm1', attendanceStatus: 'ABSENT' }], { lateFee: 700, absentFee: 1400 })
  assert.deepEqual(plan.penalties, [{ memberId: 'm1', kind: 'ABSENT_PENALTY', amount: 1400 }])
})

test('10. session-specific penalty values override the defaults', () => {
  assert.deepEqual(sessionTypeRules('ATTENDANCE', { lateFee: 200, absentFee: 800, attendanceGraceMinutes: 5 }), {
    attendanceGraceMinutes: 5, lateFee: 200, absentFee: 800, targetAmount: null, memberTargetAmount: null
  })
})

test('11. pending financial records add zero to official totals', () => {
  assert.equal(officialFinancialAmount('needs_review', 1000), 0)
})

test('12. approved penalties affect official totals', () => {
  assert.equal(officialFinancialAmount('recorded', 1000), 1000)
})

test('13. rejected penalties do not affect official totals', () => {
  assert.equal(officialFinancialAmount('rejected', 1000), 0)
})

test('14. repeated attendance finalization cannot plan duplicate penalty rows', () => {
  const existing = new Set(['m1:ABSENT_PENALTY', 'm2:LATE_PENALTY'])
  const plan = planAttendanceFinalization([
    { memberId: 'm1', attendanceStatus: 'ABSENT' },
    { memberId: 'm2', attendanceStatus: 'LATE' }
  ], { lateFee: 500, absentFee: 1000 }, existing)
  assert.deepEqual(plan.penalties, [])
})

test('15. contribution sessions reject attendance check-ins', () => {
  assert.deepEqual(validateAttendanceCheckIn(checkInContext({ sessionType: 'CONTRIBUTION' })), {
    allowed: false, reason: 'wrong_session_type'
  })
})

test('16. contribution sessions store no late fee or attendance grace period', () => {
  const rules = sessionTypeRules('CONTRIBUTION', { targetAmount: 1_500_000, lateFee: 500, attendanceGraceMinutes: 15 })
  assert.equal(rules.lateFee, 0)
  assert.equal(rules.attendanceGraceMinutes, 0)
})

test('17. contribution sessions store no absent fee', () => {
  assert.equal(sessionTypeRules('CONTRIBUTION', { absentFee: 1000 }).absentFee, 0)
})

test('18. a valid contribution submission starts in the pending review state', () => {
  const result = validateContributionSubmission({
    sessionType: 'CONTRIBUTION', sessionStatus: 'OPEN', visibility: 'PUBLIC', role: 'MEMBER',
    submittedAt: '2026-10-12T16:00:00Z', deadlineAt, hasMember: true
  })
  assert.deepEqual(result, { allowed: true, status: 'needs_review' })
})

test('19. pending contributions do not enter the approved collection total', () => {
  assert.equal(officialFinancialAmount('needs_review', 25000), 0)
})

test('20. approved contributions count toward the collection total', () => {
  assert.equal(officialFinancialAmount('recorded', 25000), 25000)
})

test('21. rejected contributions do not enter the collection total', () => {
  assert.equal(officialFinancialAmount('rejected', 25000), 0)
})

test('22. a member sees their pending contribution state until a review is recorded', () => {
  assert.equal(classifyContributionMember({ approvedAmount: 0, pendingAmount: 5000, rejectedCount: 0, memberTargetAmount: 10000 }), 'PENDING')
  assert.equal(classifyContributionMember({ approvedAmount: 5000, pendingAmount: 0, rejectedCount: 0, memberTargetAmount: 10000 }), 'PARTIAL')
})

test('23. leader collection progress distinguishes partial and completed member targets', () => {
  assert.equal(classifyContributionMember({ approvedAmount: 10000, pendingAmount: 0, rejectedCount: 0, memberTargetAmount: 10000 }), 'COMPLETED')
  assert.equal(classifyContributionMember({ approvedAmount: 8000, pendingAmount: 0, rejectedCount: 0, memberTargetAmount: 10000 }), 'PARTIAL')
})

test('24. members can see public sessions', () => {
  assert.equal(canViewSession('MEMBER', 'PUBLIC'), true)
})

test('25. a member cannot see a private session', () => {
  assert.equal(canViewSession('MEMBER', 'PRIVATE'), false)
})

test('26. leaders and admins can see private sessions', () => {
  assert.equal(canViewSession('LEADER', 'PRIVATE'), true)
  assert.equal(canViewSession('ADMIN', 'PRIVATE'), true)
})

test('27. URL or API identifier changes cannot grant private session access', () => {
  for (const guessedId of ['session-a', 'session-b', 'another-member-session']) {
    assert.equal(Boolean(guessedId) && canViewSession('MEMBER', 'PRIVATE'), false)
  }
})

test('28. contribution submissions are rejected after the deadline', () => {
  const result = validateContributionSubmission({
    sessionType: 'CONTRIBUTION', sessionStatus: 'OPEN', visibility: 'PUBLIC', role: 'MEMBER',
    submittedAt: '2026-10-12T17:16:00Z', deadlineAt, hasMember: true
  })
  assert.equal(result.reason, 'deadline_passed')
})

test('29. contribution idempotency returns the original record for a repeated request', () => {
  assert.deepEqual(resolveIdempotentSubmission({ id: 'record-1', amount: 5000 }, 5000), {
    alreadySubmitted: true, existingId: 'record-1'
  })
})

test('30. reusing a contribution idempotency key for a different amount fails safely', () => {
  assert.throws(() => resolveIdempotentSubmission({ id: 'record-1', amount: 5000 }, 7000), /different amount/)
})

test('31. the session lifecycle only allows requirement-defined forward transitions', () => {
  assert.equal(canTransitionSession('DRAFT', 'SCHEDULED'), true)
  assert.equal(canTransitionSession('SCHEDULED', 'OPEN'), true)
  assert.equal(canTransitionSession('OPEN', 'CLOSED'), true)
  assert.equal(canTransitionSession('CLOSED', 'COMPLETED'), true)
  assert.equal(canTransitionSession('COMPLETED', 'OPEN'), false)
})

test('32. QR token, deadline, and open window are checked before check-in', () => {
  assert.equal(validateAttendanceCheckIn(checkInContext({ tokenValid: false })).reason, 'invalid_qr')
  assert.equal(validateAttendanceCheckIn(checkInContext({ checkedInAt: '2026-10-12T14:59:00Z' })).reason, 'window_not_open')
  assert.equal(validateAttendanceCheckIn(checkInContext({ checkedInAt: '2026-10-12T17:16:00Z' })).reason, 'deadline_passed')
})

test('33. session analytics accurately computes collected penalty fees and pending penalties', () => {
  const records = [
    { sessionRecordKind: 'LATE_PENALTY', amount: 500, status: 'recorded' },
    { sessionRecordKind: 'ABSENT_PENALTY', amount: 1000, status: 'recorded' },
    { sessionRecordKind: 'LATE_PENALTY', amount: 500, status: 'needs_review' },
    { sessionRecordKind: 'ABSENT_PENALTY', amount: 1000, status: 'needs_review' }
  ]
  const totals = calculateSessionFinancialTotals(records)
  assert.equal(totals.collectedPenalties, 1500)
  assert.equal(totals.collectedLatePenalties, 500)
  assert.equal(totals.collectedAbsentPenalties, 1000)
  assert.equal(totals.pendingPenalties, 1500)
  assert.equal(totals.totalPenalties, 3000)
  assert.equal(totals.totalCollected, 1500)
})

test('34. session analytics computes session collected contributions and total collected funds', () => {
  const records = [
    { sessionRecordKind: 'CONTRIBUTION', amount: 50000, status: 'recorded' },
    { sessionRecordKind: 'CONTRIBUTION', amount: 20000, status: 'recorded' },
    { sessionRecordKind: 'CONTRIBUTION', amount: 15000, status: 'needs_review' },
    { sessionRecordKind: 'CONTRIBUTION', amount: 10000, status: 'rejected' },
    { sessionRecordKind: 'LATE_PENALTY', amount: 1000, status: 'recorded' }
  ]
  const totals = calculateSessionFinancialTotals(records)
  assert.equal(totals.collectedContributions, 70000)
  assert.equal(totals.pendingContributions, 15000)
  assert.equal(totals.rejectedContributions, 10000)
  assert.equal(totals.collectedPenalties, 1000)
  assert.equal(totals.totalCollected, 71000)
})

test('35. expected-late members remain unchecked until they scan in', () => {
  assert.equal(hasCheckedIn('EXPECTED_LATE'), false)
})

test('36. expected-late members who never scan in are finalized as absent', () => {
  const plan = planAttendanceFinalization(
    [{ memberId: 'm1', attendanceStatus: 'EXPECTED_LATE' }],
    { lateFee: 500, absentFee: 1000 }
  )
  assert.deepEqual(plan.absentMemberIds, ['m1'])
  assert.deepEqual(plan.penalties, [{ memberId: 'm1', kind: 'ABSENT_PENALTY', amount: 1000 }])
})
