export function attendanceStatusAt(checkedInAt: string | Date, startsAt: string | Date, graceMinutes: number): 'PRESENT' | 'LATE'
export function validateAttendanceCheckIn(input: {
  sessionType: string; sessionStatus: string; visibility: string; role: string; tokenValid: boolean;
  checkedInAt: string | Date; startsAt: string | Date; deadlineAt: string | Date;
  graceMinutes: number; hasMember: boolean
}): { allowed: boolean; reason?: string; status?: 'PRESENT' | 'LATE' }
export function validateContributionSubmission(input: {
  sessionType: string; sessionStatus: string; visibility: string; role: string;
  submittedAt: string | Date; deadlineAt: string | Date; hasMember: boolean
}): { allowed: boolean; reason?: string; status?: 'needs_review' }
export function sessionTypeRules(type: 'ATTENDANCE' | 'CONTRIBUTION', config?: {
  attendanceGraceMinutes?: number; lateFee?: number; absentFee?: number;
  targetAmount?: number | null; memberTargetAmount?: number | null
}): {
  attendanceGraceMinutes: number; lateFee: number; absentFee: number;
  targetAmount: number | null; memberTargetAmount: number | null
}
export function hasCheckedIn(attendanceStatus: string | null): boolean
export function resolveIdempotentSubmission(existing: { id: string; amount: number } | null, requestedAmount: number): {
  alreadySubmitted: boolean; existingId: string | null
}
export function canViewSession(role: string, visibility: string): boolean
export function canTransitionSession(from: string, to: string): boolean
export function classifyContributionMember(input: {
  approvedAmount: number
  pendingAmount: number
  rejectedCount: number
  memberTargetAmount: number | null
}): 'COMPLETED' | 'PARTIAL' | 'CONTRIBUTED' | 'PENDING' | 'REJECTED' | 'NOT_YET'
export function officialFinancialAmount(status: string, amount: number): number
export function planAttendanceFinalization(
  roster: { memberId: string; attendanceStatus: string | null }[],
  fees: { lateFee: number; absentFee: number },
  existingPenaltyKeys?: Set<string>
): { absentMemberIds: string[]; penalties: { memberId: string; kind: 'LATE_PENALTY' | 'ABSENT_PENALTY'; amount: number }[] }
