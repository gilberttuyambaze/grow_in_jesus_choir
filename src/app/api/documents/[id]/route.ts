import { NextResponse } from 'next/server'
import path from 'node:path'
import fs from 'node:fs'
import { getSessionUser } from '@/lib/auth/session'
import { getDocumentById } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser()
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const doc = getDocumentById(id)
  if (!doc) {
    return new NextResponse('Document not found', { status: 404 })
  }

  const uploadDir = path.resolve(process.cwd(), 'data/uploads')
  const filePath = path.join(uploadDir, doc.filename)

  if (!fs.existsSync(filePath)) {
    // Fallback for seed mock files: return mock buffer
    const mockContent = Buffer.from(`Grow in Jesus Choir Receipt\nDocument: ${doc.originalName}\nUploaded by: ${doc.uploadedByName}\nSize: ${doc.sizeBytes} bytes\nNotes: ${doc.notes || 'None'}`)
    return new NextResponse(mockContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `inline; filename="${doc.originalName}"`
      }
    })
  }

  const fileBuffer = fs.readFileSync(filePath)
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': doc.mimeType,
      'Content-Disposition': `inline; filename="${doc.originalName}"`
    }
  })
}

