/**
 * Domain & Application Types for Grow in Jesus Choir Financial Platform
 */

export type UserRole = 'MEMBER' | 'LEADER' | 'ADMIN' | 'AUDITOR'
export type InvitationRole = Extract<UserRole, 'MEMBER' | 'LEADER' | 'ADMIN'>

export interface User {
  id: string
  email: string
  role: UserRole
  fullName: string
  avatarInitials: string
  createdAt: string
}

export interface Member {
  id: string
  userId?: string | null
  fullName: string
  phone?: string | null
  voicePart: 'Soprano' | 'Alto' | 'Tenor' | 'Bass'
  status: 'active' | 'inactive'
  joinedDate: string
  createdAt: string
}

export type MemberInvitationStatus = 'PENDING' | 'SENT' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED' | 'FAILED'
export interface MemberInvitation {
  id: string
  email: string
  fullName: string
  phone: string | null
  voicePart: Member['voicePart']
  invitedRole: InvitationRole
  status: MemberInvitationStatus
  invitedByName: string
  message: string
  expiresAt: string
  createdAt: string
  lastSentAt: string | null
  resendCount: number
}

export type MemberCommunicationMode = 'SINGLE_MEMBER' | 'SELECTED_MEMBERS' | 'ALL_MEMBERS' | 'MANUAL_EMAIL'
export type MemberCommunicationStatus = 'QUEUED' | 'SENDING' | 'SENT' | 'PARTIAL' | 'FAILED'
export type MemberCommunicationRecipientStatus = 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED'
export interface MemberCommunicationRecipient {
  id: string
  memberId: string | null
  recipientEmail: string
  recipientName: string
  status: MemberCommunicationRecipientStatus
  sentAt: string | null
  lastError: string | null
}
export interface MemberCommunication {
  id: string
  senderName: string
  recipientsMode: MemberCommunicationMode
  subject: string
  body: string
  status: MemberCommunicationStatus
  important: boolean
  inAppNotification: boolean
  recipientCount: number
  invalidCount: number
  sentCount: number
  failedCount: number
  createdAt: string
  completedAt: string | null
  recipients: MemberCommunicationRecipient[]
}

export type FinancialRecordType = 'income' | 'expense'
export type FinancialRecordStatus = 'recorded' | 'needs_review' | 'rejected' | 'voided'

export interface FinancialCategory {
  id: string
  name: string
  type: FinancialRecordType
  description?: string | null
  isActive: boolean
}

export interface FinancialRecord {
  id: string
  type: FinancialRecordType
  categoryId: string
  categoryName?: string
  amount: number // Integer in RWF
  currency: string
  recordDate: string
  description: string
  memberId?: string | null
  memberName?: string | null
  recordedById: string
  recordedByName?: string
  status: FinancialRecordStatus
  rejectionReason?: string | null
  receiptFilename?: string | null
  referenceNumber?: string | null
  sessionId?: string | null
  sessionRecordKind?: 'CONTRIBUTION' | 'LATE_PENALTY' | 'ABSENT_PENALTY' | null
  createdAt: string
  updatedAt: string
}

export type ChoirSessionType = 'ATTENDANCE' | 'CONTRIBUTION'
export type ChoirSessionVisibility = 'PUBLIC' | 'PRIVATE'
export type ChoirSessionStatus = 'DRAFT' | 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'COMPLETED'
export type AttendanceStatus = 'NOT_CHECKED_IN' | 'PRESENT' | 'LATE' | 'ABSENT'
export type ContributionMemberStatus = 'COMPLETED' | 'PARTIAL' | 'CONTRIBUTED' | 'PENDING' | 'REJECTED' | 'NOT_YET'

export interface ChoirSession {
  id: string
  title: string
  description: string
  type: ChoirSessionType
  location: string | null
  startsAt: string
  endsAt: string
  deadlineAt: string
  visibility: ChoirSessionVisibility
  status: ChoirSessionStatus
  attendanceGraceMinutes: number
  lateFee: number
  absentFee: number
  targetAmount: number | null
  memberTargetAmount: number | null
  financialCategoryId: string | null
  createdById: string
  createdByName: string
  createdAt: string
  updatedAt: string
  closedAt: string | null
}

export interface SessionRosterEntry {
  memberId: string
  memberName: string
  voicePart: Member['voicePart']
  attendanceStatus: AttendanceStatus | null
  checkedInAt: string | null
  approvedAmount: number
  pendingAmount: number
  rejectedCount: number
  contributionStatus: ContributionMemberStatus | null
  penaltyAmount: number
  penaltyStatus: FinancialRecordStatus | null
}

export interface SessionOverview {
  session: ChoirSession
  roster: SessionRosterEntry[]
  totalMembers: number
  presentCount: number
  lateCount: number
  absentCount: number
  notCheckedInCount: number
  approvedAmount: number
  pendingAmount: number
  rejectedAmount: number
  contributorCount: number
  partialCount: number
  completedCount: number
  pendingContributorCount: number
  rejectedSubmissionCount: number
  notYetCount: number
}

export interface MemberSessionHistoryItem {
  sessionId: string
  title: string
  type: ChoirSessionType
  startsAt: string
  status: ChoirSessionStatus
  attendanceStatus: AttendanceStatus | null
  approvedAmount: number
  pendingAmount: number
  contributionStatus: ContributionMemberStatus | null
  penaltyAmount: number
  penaltyStatus: FinancialRecordStatus | null
}

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  currentBalance: number
  pendingCount: number
  totalTransactions: number
  totalMembers: number
  membersContributed: number
  contributionPercentage: number
  healthStatus: 'Healthy' | 'Moderate' | 'Needs Attention'
}

export interface AuditLogEntry {
  id: string
  actorId?: string | null
  actorName: string
  action: string
  targetType: string
  targetId: string
  details?: Record<string, unknown> | null
  createdAt: string
}

export interface NotificationItem {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'alert'
  isRead: boolean
  link?: string | null
  createdAt: string
}

export interface FinancialDocument {
  id: string
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  recordId?: string | null
  recordDescription?: string | null
  recordAmount?: number | null
  uploadedById: string
  uploadedByName: string
  notes?: string | null
  createdAt: string
}
