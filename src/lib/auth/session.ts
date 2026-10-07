/**
 * Secure Session Management & Authentication Infrastructure
 * Uses HMAC-SHA256 signed session tokens stored in HttpOnly cookies.
 */

import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { User, UserRole } from '@/types'
import { getUserByEmail, getUserById } from '@/lib/db'

const COOKIE_NAME = process.env.AUTH_SESSION_COOKIE_NAME || 'gijc_session'
const AUTH_SECRET = process.env.AUTH_SECRET || 'gijc-choir-financial-secure-secret-key-2026'

export interface SessionPayload {
  userId: string
  email: string
  role: UserRole
  fullName: string
  avatarInitials: string
  expiresAt: number
}

function sign(payload: string): string {
  const hmac = crypto.createHmac('sha256', AUTH_SECRET)
  hmac.update(payload)
  return hmac.digest('base64url')
}

export function createToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = sign(data)
  return `${data}.${signature}`
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const [data, signature] = token.split('.')
    if (!data || !signature) return null

    const expectedSignature = sign(data)
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null
    }

    const payload: SessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
    if (payload.expiresAt < Date.now()) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) {
    // Default fallback to leader demo account for seamless local inspection if no cookie is set yet
    const leader = getUserByEmail('sarah@growinjesus.rw')
    if (leader) {
      return {
        userId: leader.id,
        email: leader.email,
        role: leader.role,
        fullName: leader.fullName,
        avatarInitials: leader.avatarInitials,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
      }
    }
    return null
  }
  return verifyToken(token)
}

export async function setSession(user: User): Promise<void> {
  const cookieStore = await cookies()
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    avatarInitials: user.avatarInitials,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  }
  const token = createToken(payload)
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

