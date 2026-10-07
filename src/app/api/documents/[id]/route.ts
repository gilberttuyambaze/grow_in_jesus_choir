import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { getDocumentById } from '@/lib/db'
import { downloadFromStorage } from '@/lib/storage'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser()
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const doc = await getDocumentById(id)
  if (!doc) {
    return new NextResponse('Document not found', { status: 404 })
  }

  // Attempt download from Supabase Storage
  const fileBuffer = await downloadFromStorage(doc.filename)

  if (!fileBuffer) {
    // Fallback for mock preview if file not generated yet
    const mockContent = Buffer.from(
      `Grow in Jesus Choir Receipt\nDocument: ${doc.originalName}\nUploaded by: ${doc.uploadedByName}\nSize: ${doc.sizeBytes} bytes\nNotes: ${doc.notes || 'None'}`
    )
    return new NextResponse(mockContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `inline; filename="${doc.originalName}"`
      }
    })
  }

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': doc.mimeType,
      'Content-Disposition': `inline; filename="${doc.originalName}"`
    }
  })
}

