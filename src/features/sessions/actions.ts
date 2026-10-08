'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth/session'
import { canManageMembers } from '@/lib/permissions'
import {
  checkInToAttendanceSession,
  completeChoirSession,
  createChoirSession,
  openChoirSession,
  publishChoirSession,
  rotateAttendanceQr,
  submitSessionContribution,
  updateSessionAttendance,
  updateChoirSession,
  ChoirSessionInput
} from '@/lib/db'
import { parseCurrencyInput } from '@/lib/utils/currency'
import { localDateTimeToIso } from '@/lib/utils/zoned-time'
import { deliverBrevoOutbox } from '@/lib/email/brevo'
import { AttendanceStatus, UserRole } from '@/types'
import { sessionTypeRules } from './domain.mjs'

const MAX_RWF_AMOUNT = 9_000_000_000_000

function readString(formData: FormData, key: string, maxLength: number): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length <= maxLength ? trimmed : null
}

function readAmount(formData: FormData, key: string, fallback: number): number | null {
  const raw = formData.get(key)
  if (raw == null || raw === '') return fallback
  if (typeof raw !== 'string' || raw.length > 30) return null
  const normalized = raw.replace(/[ ,]/g, '')
  if (!/^\d+$/.test(normalized)) return null
  const amount = parseCurrencyInput(normalized)
  return Number.isSafeInteger(amount) && amount >= 0 && amount <= MAX_RWF_AMOUNT ? amount : null
}

function parseSessionForm(formData: FormData): { input?: ChoirSessionInput; error?: string } {
  const title = readString(formData, 'title', 160)
  const description = readString(formData, 'description', 2000)
  const locationRaw = readString(formData, 'location', 200)
  const typeRaw = readString(formData, 'type', 20)
  const visibilityRaw = readString(formData, 'visibility', 20)
  const startsAtRaw = readString(formData, 'startsAt', 32)
  const endsAtRaw = readString(formData, 'endsAt', 32)
  const deadlineAtRaw = readString(formData, 'deadlineAt', 32)
  const categoryRaw = readString(formData, 'financialCategoryId', 100)
  if (!title || !title.trim()) return { error: 'Enter a title for this session.' }
  if (description === null) return { error: 'Keep the description under 2,000 characters.' }
  if (locationRaw === null) return { error: 'Keep the location under 200 characters.' }
  if (typeRaw !== 'ATTENDANCE' && typeRaw !== 'CONTRIBUTION') return { error: 'Choose an attendance or contribution session.' }
  if (typeRaw === 'ATTENDANCE' && !locationRaw) return { error: 'Enter the attendance session location.' }
  if (visibilityRaw !== 'PUBLIC' && visibilityRaw !== 'PRIVATE') return { error: 'Choose public or private visibility.' }
  if (startsAtRaw === null || endsAtRaw === null || deadlineAtRaw === null) return { error: 'Enter a valid start, end, and deadline time.' }
  const startsAt = localDateTimeToIso(startsAtRaw)
  const endsAt = localDateTimeToIso(endsAtRaw)
  const deadlineAt = localDateTimeToIso(deadlineAtRaw)
  if (!startsAt || !endsAt || !deadlineAt) return { error: 'These local times are invalid for the choir’s configured time zone.' }
  const startTime = new Date(startsAt).getTime()
  const endTime = new Date(endsAt).getTime()
  const deadlineTime = new Date(deadlineAt).getTime()
  if (endTime <= startTime) return { error: 'The end time must be after the start time.' }
  if (deadlineTime < startTime) return { error: 'The deadline must be at or after the start time.' }

  const attendanceGraceMinutes = typeRaw === 'ATTENDANCE'
    ? readAmount(formData, 'attendanceGraceMinutes', 0)
    : 0
  const lateFee = typeRaw === 'ATTENDANCE' ? readAmount(formData, 'lateFee', 500) : 0
  const absentFee = typeRaw === 'ATTENDANCE' ? readAmount(formData, 'absentFee', 1000) : 0
  const targetAmount = typeRaw === 'CONTRIBUTION' ? readAmount(formData, 'targetAmount', 0) : null
  const memberTargetAmount = typeRaw === 'CONTRIBUTION' ? readAmount(formData, 'memberTargetAmount', 0) : null
  if (attendanceGraceMinutes === null || attendanceGraceMinutes > 1440) return { error: 'On-time grace must be between 0 and 1,440 minutes.' }
  if (lateFee === null || absentFee === null) return { error: 'Penalty amounts must be whole RWF amounts.' }
  if (typeRaw === 'CONTRIBUTION' && (targetAmount === null || targetAmount <= 0)) {
    return { error: 'Enter a collection target greater than zero.' }
  }
  if (typeRaw === 'CONTRIBUTION' && (memberTargetAmount === null || memberTargetAmount > 0 && memberTargetAmount > (targetAmount || 0))) {
    return { error: 'A per-member target cannot be greater than the collection target.' }
  }
  const financialCategoryId = categoryRaw || null
  if (typeRaw === 'CONTRIBUTION' && !financialCategoryId) return { error: 'Choose an income category for contributions.' }
  if (typeRaw === 'ATTENDANCE' && (lateFee > 0 || absentFee > 0) && !financialCategoryId) {
    return { error: 'Choose an income category for attendance penalties.' }
  }
  const typeRules = sessionTypeRules(typeRaw, {
    attendanceGraceMinutes: attendanceGraceMinutes || 0,
    lateFee: lateFee || 0,
    absentFee: absentFee || 0,
    targetAmount,
    memberTargetAmount
  })
  return {
    input: {
      title,
      description,
      type: typeRaw,
      location: locationRaw || null,
      startsAt,
      endsAt,
      deadlineAt,
      visibility: visibilityRaw,
      attendanceGraceMinutes: typeRules.attendanceGraceMinutes,
      lateFee: typeRules.lateFee,
      absentFee: typeRules.absentFee,
      targetAmount: typeRules.targetAmount,
      memberTargetAmount: typeRules.memberTargetAmount,
      financialCategoryId
    }
  }
}

function permissionError(role: UserRole) {
  return !canManageMembers(role) ? 'Only leaders and admins can manage sessions.' : null
}

async function flushBrevoQueue() {
  try {
    await deliverBrevoOutbox(5)
  } catch (error) {
    console.error('[Brevo outbox delivery]', error instanceof Error ? error.message : 'unknown error')
  }
}

function refreshSessionRoutes(sessionId?: string) {
  revalidatePath('/sessions')
  revalidatePath('/finances')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
  if (sessionId) revalidatePath(`/sessions/${sessionId}`)
}

export async function saveSessionAction(formData: FormData) {
  const actor = await getSessionUser()
  if (!actor) return { success: false, error: 'Sign in to manage sessions.' }
  const denied = permissionError(actor.role)
  if (denied) return { success: false, error: denied }
  const parsed = parseSessionForm(formData)
  if (!parsed.input) return { success: false, error: parsed.error || 'Review the session details.' }
  const existingId = readString(formData, 'sessionId', 100)
  try {
    if (existingId) {
      const saved = await updateChoirSession(existingId, parsed.input, { id: actor.userId, name: actor.fullName })
      if (!saved) return { success: false, error: 'Only draft or scheduled sessions can be edited.' }
      refreshSessionRoutes(existingId)
      return { success: true, id: existingId, message: 'Session details saved.' }
    }
    const session = await createChoirSession(parsed.input, { id: actor.userId, name: actor.fullName })
    refreshSessionRoutes(session.id)
    return { success: true, id: session.id, message: 'Draft session created. Schedule it when it is ready.' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not save the session.' }
  }
}

export async function publishSessionAction(sessionId: string) {
  const actor = await getSessionUser()
  if (!actor) return { success: false, error: 'Sign in to manage sessions.' }
  const denied = permissionError(actor.role)
  if (denied) return { success: false, error: denied }
  if (typeof sessionId !== 'string' || !sessionId || sessionId.length > 100) return { success: false, error: 'Invalid session.' }
  try {
    const published = await publishChoirSession(sessionId, { id: actor.userId, name: actor.fullName })
    if (!published) return { success: false, error: 'This session is not a draft.' }
    refreshSessionRoutes(sessionId)
    await flushBrevoQueue()
    return { success: true, message: 'Session scheduled and members notified.' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not schedule the session.' }
  }
}

export async function openSessionAction(sessionId: string) {
  const actor = await getSessionUser()
  if (!actor) return { success: false, error: 'Sign in to manage sessions.' }
  const denied = permissionError(actor.role)
  if (denied) return { success: false, error: denied }
  if (typeof sessionId !== 'string' || !sessionId || sessionId.length > 100) return { success: false, error: 'Invalid session.' }
  try {
    const result = await openChoirSession(sessionId, { id: actor.userId, name: actor.fullName })
    if (!result.opened) return { success: false, error: 'Only scheduled sessions can be opened.' }
    refreshSessionRoutes(sessionId)
    await flushBrevoQueue()
    return { success: true, qrToken: result.qrToken, message: 'Session opened.' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not open the session.' }
  }
}

export async function rotateSessionQrAction(sessionId: string) {
  const actor = await getSessionUser()
  if (!actor) return { success: false, error: 'Sign in to manage sessions.' }
  const denied = permissionError(actor.role)
  if (denied) return { success: false, error: denied }
  if (typeof sessionId !== 'string' || !sessionId || sessionId.length > 100) return { success: false, error: 'Invalid session.' }
  try {
    const result = await rotateAttendanceQr(sessionId, { id: actor.userId, name: actor.fullName })
    if (!result.opened || !result.qrToken) return { success: false, error: 'QR codes are available only for open attendance sessions.' }
    return { success: true, qrToken: result.qrToken }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not refresh the QR code.' }
  }
}

export async function updateAttendanceAction(
  sessionId: string,
  memberIds: string[],
  status: AttendanceStatus
) {
  const actor = await getSessionUser()
  if (!actor) return { success: false, error: 'Sign in to manage attendance.' }
  const denied = permissionError(actor.role)
  if (denied) return { success: false, error: denied }
  if (typeof sessionId !== 'string' || !sessionId || sessionId.length > 100) {
    return { success: false, error: 'Invalid session.' }
  }
  if (!Array.isArray(memberIds) || memberIds.length === 0 || memberIds.length > 500 ||
      memberIds.some((id) => typeof id !== 'string' || !id || id.length > 100)) {
    return { success: false, error: 'Select between 1 and 500 valid roster members.' }
  }
  if (!['NOT_CHECKED_IN', 'EXPECTED_LATE', 'PRESENT', 'LATE', 'ABSENT'].includes(status)) {
    return { success: false, error: 'Choose a valid attendance status.' }
  }

  try {
    const updatedCount = await updateSessionAttendance(
      sessionId,
      memberIds,
      status,
      { id: actor.userId, name: actor.fullName }
    )
    refreshSessionRoutes(sessionId)
    const statusLabel = status === 'EXPECTED_LATE' ? 'expected late' : status.toLowerCase().replaceAll('_', ' ')
    return {
      success: true,
      updatedCount,
      message: updatedCount === 1
        ? `Attendance updated to ${statusLabel}.`
        : `Attendance updated to ${statusLabel} for ${updatedCount} members.`
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not update attendance.' }
  }
}

export async function closeSessionAction(sessionId: string) {
  const actor = await getSessionUser()
  if (!actor) return { success: false, error: 'Sign in to manage sessions.' }
  const denied = permissionError(actor.role)
  if (denied) return { success: false, error: denied }
  if (typeof sessionId !== 'string' || !sessionId || sessionId.length > 100) return { success: false, error: 'Invalid session.' }
  try {
    const result = await completeChoirSession(sessionId, { id: actor.userId, name: actor.fullName })
    if (!result.completed) return { success: false, error: 'The session could not be completed.' }
    refreshSessionRoutes(sessionId)
    return {
      success: true,
      alreadyCompleted: result.alreadyCompleted,
      message: result.alreadyCompleted ? 'This session was already completed.' : `Session completed. ${result.penaltiesCreated} pending penalty record(s) created.`
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not close the session.' }
  }
}

export async function checkInAction(sessionId: string, token: string) {
  const actor = await getSessionUser()
  if (!actor) return { success: false, error: 'Sign in before checking in.' }
  if (actor.role === 'AUDITOR') return { success: false, error: 'Auditor accounts cannot check in as members.' }
  if (typeof sessionId !== 'string' || !sessionId || sessionId.length > 100 ||
      typeof token !== 'string' || token.length > 100) return { success: false, error: 'This check-in link is invalid.' }
  try {
    const result = await checkInToAttendanceSession({
      sessionId, token, userId: actor.userId, userName: actor.fullName, role: actor.role
    })
    revalidatePath(`/sessions/${sessionId}`)
    revalidatePath('/sessions')
    return {
      success: true,
      alreadyCheckedIn: result.alreadyCheckedIn,
      status: result.status,
      message: result.alreadyCheckedIn
        ? `You’re already checked in as ${result.status.toLowerCase()}.`
        : `Attendance confirmed as ${result.status.toLowerCase()}.`
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not check you in.' }
  }
}

export async function submitContributionAction(input: {
  sessionId: string
  amount: string
  requestKey: string
  note?: string
}) {
  const actor = await getSessionUser()
  if (!actor) return { success: false, error: 'Sign in before submitting a contribution.' }
  if (actor.role === 'AUDITOR') return { success: false, error: 'Auditor accounts cannot submit contributions.' }
  if (!input || typeof input.sessionId !== 'string' || input.sessionId.length > 100 ||
      typeof input.amount !== 'string' || input.amount.length > 30 ||
      typeof input.requestKey !== 'string' || !/^[0-9a-f-]{36}$/i.test(input.requestKey) ||
      (input.note != null && (typeof input.note !== 'string' || input.note.length > 500))) {
    return { success: false, error: 'Contribution details are invalid.' }
  }
  const amount = parseCurrencyInput(input.amount)
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_RWF_AMOUNT) {
    return { success: false, error: 'Enter a contribution amount greater than zero.' }
  }
  try {
    const result = await submitSessionContribution({
      sessionId: input.sessionId, userId: actor.userId, userName: actor.fullName,
      role: actor.role, amount, requestKey: input.requestKey, note: input.note?.trim() || ''
    })
    refreshSessionRoutes(input.sessionId)
    await flushBrevoQueue()
    return {
      success: true,
      alreadySubmitted: result.alreadySubmitted,
      message: result.alreadySubmitted ? 'This contribution was already submitted for review.' : 'Contribution submitted for review.'
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not submit the contribution.' }
  }
}
