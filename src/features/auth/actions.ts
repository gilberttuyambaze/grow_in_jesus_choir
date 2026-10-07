'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  clearLoginFailures,
  getUserByEmail,
  getUserForPasswordChange,
  isLoginBlocked,
  recordLoginFailure,
  updateUserPassword
} from '@/lib/db'
import { clearSession, getSessionUser, setSession } from '@/lib/auth/session'
import { consumeDummyPasswordCheck, hashPassword, validateNewPassword, verifyPassword } from '@/lib/auth/password'

const INVALID_LOGIN = 'Email or password is incorrect.'

export async function loginAction(formData: FormData) {
  const rawEmail = formData.get('email')
  const rawPassword = formData.get('password')
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''
  const password = typeof rawPassword === 'string' ? rawPassword : ''

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || Buffer.byteLength(password, 'utf8') > 1024) {
    return { success: false, error: INVALID_LOGIN }
  }

  let user
  try {
    if (await isLoginBlocked(email)) return { success: false, error: INVALID_LOGIN }
    user = await getUserByEmail(email)
    const passwordMatches = user
      ? await verifyPassword(password, user.passwordHash)
      : (await consumeDummyPasswordCheck(password), false)

    if (!passwordMatches || !user) {
      await recordLoginFailure(email)
      return { success: false, error: INVALID_LOGIN }
    }

    await clearLoginFailures(email)
    await setSession(user)
  } catch {
    return { success: false, error: 'Sign in is temporarily unavailable. Please try again.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function quickLoginAction(email: string) {
  try {
    const user = await getUserByEmail(email.trim().toLowerCase())
    if (!user) {
      return { success: false, error: 'Account not found.' }
    }
    await setSession(user)
  } catch {
    return { success: false, error: 'Sign in is temporarily unavailable. Please try again.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function changePasswordAction(formData: FormData) {
  const session = await getSessionUser()
  if (!session) return { success: false, error: 'Your session has expired. Sign in again.' }

  const rawCurrentPassword = formData.get('currentPassword')
  const rawNewPassword = formData.get('newPassword')
  const currentPassword = typeof rawCurrentPassword === 'string' ? rawCurrentPassword : ''
  const newPassword = typeof rawNewPassword === 'string' ? rawNewPassword : ''
  if (Buffer.byteLength(currentPassword, 'utf8') > 1024) {
    return { success: false, error: 'Current password is incorrect.' }
  }
  const validationError = validateNewPassword(newPassword)
  if (validationError) return { success: false, error: validationError }

  try {
    const user = await getUserForPasswordChange(session.userId)
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return { success: false, error: 'Current password is incorrect.' }
    }

    await updateUserPassword(session.userId, await hashPassword(newPassword))
    await setSession(user)
  } catch {
    return { success: false, error: 'Password could not be updated. Please try again.' }
  }

  revalidatePath('/', 'layout')
  return { success: true, message: 'Password updated. Other signed-in sessions were closed.' }
}

export async function logoutAction() {
  try {
    await clearSession()
  } catch {
    return { success: false, error: 'Sign out is temporarily unavailable. Please try again.' }
  }
  revalidatePath('/', 'layout')
  redirect('/login')
}
