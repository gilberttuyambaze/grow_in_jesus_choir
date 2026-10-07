import { NextResponse } from 'next/server'
import { canViewAllFinances } from '@/lib/permissions'
import { getSessionUser } from '@/lib/auth/session'
import { getDocumentById } from '@/lib/db'
import { downloadFromStorage } from '@/lib/storage'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params
  const document = await getDocumentById(id, canViewAllFinances(session.role) ? undefined : session.userId)
  if (!document) return new NextResponse('Document not found', { status: 404 })

  const file = await downloadFromStorage(document.filename)
  if (!file) return new NextResponse('Document content is unavailable', { status: 404 })

  return new NextResponse(file, {
    headers: {
      'Content-Type': document.mimeType,
      'Content-Disposition': 'inline; filename="document"',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "sandbox; default-src 'none'"
    }
  })
}
