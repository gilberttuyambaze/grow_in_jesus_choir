/**
 * Domain & Application Types for Grow in Jesus Choir Financial Platform
 */

export type UserRole = 'MEMBER' | 'LEADER' | 'ADMIN' | 'AUDITOR'

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
  createdAt: string
  updatedAt: string
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
