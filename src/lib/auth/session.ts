import 'server-only'

import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { User } from '@/types'
import { createAuthSession, getAuthSession, revokeAuthSession } from '@/lib/db'

const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60
const COOKIE_NAME = process.env.AUTH_SESSION_COOKIE_NAME?.trim() ||
  (process.env.NODE_ENV === 'production' ? '__Host-gijc_session' : 'gijc_session')

export interface SessionPayload {
  userId: string
  id: string
  email: string
  role: User['role']
  fullName: string
  avatarInitials: string
  expiresAt: number
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null

  const user = await getAuthSession(hashToken(token))
  if (!user) return null
  return {
    userId: user.id,
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    avatarInitials: user.avatarInitials,
    expiresAt: user.expiresAt
  }
}

export async function setSession(user: User): Promise<void> {
  const token = crypto.randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000)
  await createAuthSession(user.id, hashToken(token), expiresAt)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: expiresAt,
    maxAge: SESSION_DURATION_SECONDS
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  cookieStore.delete(COOKIE_NAME)
  if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) {
    try {
      await revokeAuthSession(hashToken(token))
    } catch {
      // The browser cookie is cleared even if PostgreSQL is temporarily unavailable.
    }
  }
}
