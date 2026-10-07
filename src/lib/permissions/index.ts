/**
 * Centralized Role-Based Access Control (RBAC) Permissions Engine
 * Enforces server-side authorization across financial workflows.
 */

import { UserRole } from '@/types'

export interface UserPermissionContext {
  userId: string
  role: UserRole
}

export function canViewAllFinances(role: UserRole): boolean {
  return role === 'LEADER' || role === 'ADMIN' || role === 'AUDITOR'
}

export function canCreateRecord(role: UserRole): boolean {
  return role === 'LEADER' || role === 'MEMBER' || role === 'ADMIN'
}

export function canCreateExpense(role: UserRole): boolean {
  return role === 'LEADER' || role === 'ADMIN'
}

export function canApproveRecord(role: UserRole): boolean {
  return role === 'LEADER' || role === 'ADMIN'
}

export function canManageMembers(role: UserRole): boolean {
  return role === 'LEADER' || role === 'ADMIN'
}

export function canViewAuditLog(role: UserRole): boolean {
  return role === 'LEADER' || role === 'ADMIN' || role === 'AUDITOR'
}

export function canViewReports(role: UserRole): boolean {
  return role === 'LEADER' || role === 'ADMIN' || role === 'AUDITOR'
}

export function canEditSettings(role: UserRole): boolean {
  return role === 'LEADER' || role === 'ADMIN'
}

export function canViewMemberRecord(
  actorRole: UserRole,
  actorUserId: string,
  targetMemberUserId?: string | null
): boolean {
  if (canViewAllFinances(actorRole)) return true
  return Boolean(targetMemberUserId && actorUserId === targetMemberUserId)
}

