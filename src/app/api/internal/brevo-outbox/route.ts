import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { queueDueSessionNotifications } from '@/lib/db'
import { deliverBrevoOutbox } from '@/lib/email/brevo'

export const dynamic = 'force-dynamic'

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const authorization = request.headers.get('authorization') || ''
  const supplied = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  const expectedBytes = Buffer.from(secret)
  const suppliedBytes = Buffer.from(supplied)
  return expectedBytes.length === suppliedBytes.length && crypto.timingSafeEqual(expectedBytes, suppliedBytes)
}

async function processQueue(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json({ error: 'Scheduled email processing is not configured.' }, { status: 503 })
  }
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  try {
    const notificationsQueued = await queueDueSessionNotifications(500)
    const delivery = await deliverBrevoOutbox(20)
    return NextResponse.json({ notificationsQueued, ...delivery })
  } catch {
    return NextResponse.json({ error: 'Email queue processing failed.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return processQueue(request)
}

export async function GET(request: NextRequest) {
  return processQueue(request)
}
